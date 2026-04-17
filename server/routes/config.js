const express = require('express')
const router = express.Router()
const { ConfigManager } = require('../managers/index.js')
const cm = new ConfigManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage(), limits: config.MAX_FILE_SIZE })

// 替换配置文件
router.post('/replace', upload.single('file'), async (req, res) => {
	const result = await cm.replace(req?.file)
	res.status(result.code).json(result)
})

// 获取配置数据
router.get('/', async (req, res) => {
	const result = await cm.getConfigData()
	res.status(result.code).json(result)
})

// 写入新配置数据
router.post('/write', async (req, res) => {
	const { data } = req?.body || {}
	const result = await cm.writeConfig(data)
	res.status(result.code).json(result)
})

module.exports = router
