const jwt = require('jsonwebtoken')
const { JWT_SECRET, JWT_EXPIRES_IN, USERNAME, PASSWORD } = require('../config.js')
const svgCaptcha = require('svg-captcha')
const CAPTCHA_EXPIRE = 24 * 60 * 60 * 1000 // 验证码取消间隔
const LRUCache = require('../utils/LRUCache.js')

class AuthManager {
	constructor() {
		/**
		 * @type {Map<string, {failCount: number, captcha: string, expireAt: number}>}
		 * key:用户名, value:{failCount:登录错误次数, captcha:验证码, expireAt:验证码取消时间戳}
		 */
		this.loginMap = new LRUCache(1000) // 最大缓存1000个对象
	}
	_shouldUseCaptcha(failCount) {
		return failCount >= 2 // 错误2次后需要验证码
	}
	/**
	 * @description 生成四位验证码
	 * @returns {{text: string, base64: string}}
	 */
	_generateCaptcha() {
		const captcha = svgCaptcha.create({
			size: 4,
			noise: 3,
			color: true
		})
		return {
			text: captcha.text,
			base64: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`
		}
	}
	/**
	 * @description 刷新验证码
	 * @param {string} username
	 * @returns {{ code: number, success: boolean, data?: {captchaBase64: string}, error?: any}}
	 */
	refreshCaptcha(username) {
		try {
			const current = this.loginMap.get(username) || {
				failCount: 0
			}
			const newCaptcha = this._generateCaptcha()
			this.loginMap.set(username, {
				...current,
				captcha: newCaptcha.text,
				expireAt: Date.now() + CAPTCHA_EXPIRE
			})
			return {
				code: 200,
				success: true,
				data: {
					captchaBase64: newCaptcha.base64
				}
			}
		} catch (err) {
			console.error(err)
			return {
				code: 500,
				success: false,
				message: '刷新验证码失败',
				error: err
			}
		}
	}
	/**
	 *
	 * @description 登录
	 * @param {string} username
	 * @param {string} password
	 * @param {string} captcha
	 * @returns {{ code: number, success: boolean, message?: string, data?: any, error?: any}}
	 */
	login(username, password, captcha = '') {
		if (!username || !password)
			return {
				code: 400,
				success: false,
				message: '账号或密码不能为空'
			}
		try {
			const attempt = this.loginMap.get(username)
			if (attempt && Date.now() > attempt.expireAt) {
				this.loginMap.delete(username) // 到期取消验证码,清理对应内存
			}
			const current = this.loginMap.get(username) || {
				failCount: 0
			}
			const needCaptcha = this._shouldUseCaptcha(current.failCount)
			// 需要验证码
			if (needCaptcha) {
				const realCaptcha = current.captcha
				if (!captcha || captcha?.toUpperCase() !== realCaptcha?.toUpperCase()) {
					// 验证失败,生成新的验证码
					const newCaptcha = this._generateCaptcha()
					this.loginMap.set(username, {
						...current,
						captcha: newCaptcha.text,
						expireAt: Date.now() + CAPTCHA_EXPIRE
					})
					return {
						code: 403,
						success: false,
						message: '请输入正确的验证码',
						data: {
							captchaBase64: newCaptcha.base64
						}
					}
				}
			}
			// 登录成功
			if (username === USERNAME && password === PASSWORD) {
				this.loginMap.delete(username) // 登录成功释放对应内存
				const token = jwt.sign(
					{
						username
					},
					JWT_SECRET,
					{
						expiresIn: JWT_EXPIRES_IN
					}
				)
				return {
					code: 200,
					success: true,
					message: '登录成功',
					data: {
						token,
						expiresIn: JWT_EXPIRES_IN
					}
				}
			}
			// 账号密码错误
			const newFailCount = current.failCount + 1 // 提前一次拿到验证码
			const needNewCaptcha = this._shouldUseCaptcha(newFailCount)
			const newCaptcha = needNewCaptcha ? this._generateCaptcha() : {}
			this.loginMap.set(username, {
				...current,
				failCount: newFailCount,
				captcha: newCaptcha.text,
				expireAt: needNewCaptcha ? Date.now() + CAPTCHA_EXPIRE : undefined
			})
			return {
				code: 403,
				success: false,
				message: '用户名或密码错误',
				data: {
					captchaBase64: newCaptcha.base64
				}
			}
		} catch (err) {
			console.error(err)
			return {
				code: 500,
				success: false,
				message: '登录失败',
				error: err
			}
		}
	}
	/**
	 * @description 验证token是否有效
	 * @param {string} token
	 * @returns {{ code: number, success: boolean, message?: string, data?: any }}
	 */
	verify(token) {
		if (!token) return { code: 401, success: false, message: '请先登录' }
		try {
			const decoded = jwt.verify(token, JWT_SECRET)
			return { code: 200, success: true }
		} catch {
			return { code: 401, success: false, message: '登录凭证无效' }
		}
	}
}

module.exports = AuthManager
