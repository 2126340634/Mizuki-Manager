const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config.js')

const verifyToken = (req, res, next) => {
	const header = req.headers['authorization'] || req.headers['Authorization']
	if (!header) return res.status(403).json({ code: 403, success: false, message: '未提供登录凭证' })
	const token = header && header.split(' ')[1]
	if (!token) return res.status(403).json({ code: 403, success: false, message: '登录凭证错误' })
	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			if (err.name === 'TokenExpiredError') {
				return res.status(401).json({
					code: 401,
					success: false,
					message: '登录状态已过期，请重新登录'
				})
			}
			return res.status(401).json({
				code: 401,
				success: false,
				message: '身份认证失败'
			})
		}
		req.user = user
		next()
	})
}

module.exports = { verifyToken }
