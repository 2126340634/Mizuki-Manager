const express = require('express')
const router = express.Router()
const { AuthManager } = require('../managers/index.js')
const am = new AuthManager()

router.post('/login', (req, res) => {
	const { username, password } = req?.body || {}
	const result = am.login(username, password)
	res.status(result.code).json(result)
})

module.exports = router
