const express = require('express')
const router = express.Router()
const { AuthManager } = require('../managers/index.js')
const am = new AuthManager()

router.post('/login', (req, res) => {
	const { username, password, captcha } = req?.body || {}
	const result = am.login(username, password, captcha)
	res.status(result.code).json(result)
})

router.get('/refresh-captcha', (req, res) => {
	const { username } = req?.query || {}
	const result = am.refreshCaptcha(username)
	res.status(result.code).json(result)
})

router.post('/verify', (req, res) => {
	const { token } = req?.body || {}
	const result = am.verify(token)
	res.status(result.code).json(result)
})

module.exports = router
