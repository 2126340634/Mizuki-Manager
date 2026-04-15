const express = require('express')
const router = express.Router()
const { SkillManager } = require('../managers/index.js')
const sm = new SkillManager()

// 获取配置数据
router.get('/', async (req, res) => {
	const result = await sm.getConfigData()
	res.status(result.code).json(result)
})

// 写入新配置数据
router.post('/write', async (req, res) => {
	const { data } = req?.body || {}
	const result = await sm.writeConfig(data)
	res.status(result.code).json(result)
})

module.exports = router
