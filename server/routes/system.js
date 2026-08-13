const express = require('express')
const router = express.Router()
const { SystemManager } = require('../managers/index.js')
const sm = new SystemManager()

router.get('/', async (req, res) => {
	const result = sm.getInfo()
	res.status(result.code).json(result)
})

module.exports = router
