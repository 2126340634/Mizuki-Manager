const jwt = require('jsonwebtoken')
const { JWT_SECRET, JWT_EXPIRES_IN, USERNAME, PASSWORD } = require('../config.js')

class AuthManager {
	login(username, password) {
		if (!username || !password) return { code: 400, success: false, message: '账号或密码不能为空' }
		if (username === USERNAME && password === PASSWORD) {
			const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
			return {
				code: 200,
				success: true,
				message: '登录成功',
				data: { token, expiresIn: JWT_EXPIRES_IN }
			}
		}
		return { code: 400, success: false, message: '用户名或密码错误' }
	}
}

module.exports = AuthManager
