const express = require('express')
const router = express.Router()
const { TimelineManager } = require('../managers/index.js')
const tm = new TimelineManager()

// 获取配置数据
router.get('/', async (req, res) => {
	const result = await tm.getConfigData()
	res.status(result.code).json(result)
})

// 写入新配置数据
router.post('/write', async (req, res) => {
	const { data } = req.body
	const result = await tm.writeConfig(data)
	res.status(result.code).json(result)
})

module.exports = router
