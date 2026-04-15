const express = require('express')
const router = express.Router()
const { DiaryManager } = require('../managers/index.js')
const dm = new DiaryManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage, limits: config.MAX_FILE_SIZE })

// 上传图片(支持批量)
router.post('/upload', upload.array('files'), async (req, res) => {
	const result = await dm.uploadImages(req?.files)
	res.status(result.code).json(result)
})

// 获取配置数据
router.get('/', async (req, res) => {
	const result = await dm.getConfigData()
	res.status(result.code).json(result)
})

// 写入新配置数据
router.post('/write', async (req, res) => {
	const { data } = req?.body || {}
	const result = await dm.writeConfig(data)
	res.status(result.code).json(result)
})

module.exports = router
