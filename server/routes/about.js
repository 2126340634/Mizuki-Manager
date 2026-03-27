const express = require('express')
const router = express.Router()
const { AboutManager } = require('../managers/index.js')
const am = new AboutManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage, limits: config.MAX_FILE_SIZE })

// 获取about内容
router.get('/', async (req, res) => {
	const result = await am.getContent()
	res.status(result.code).json(result)
})

// 更新about
router.post('/update', async (req, res) => {
	const { content } = req.body
	const result = await am.update(content)
	res.status(result.code).json(result)
})

// 替换about
router.post('/upload', upload.single('file'), async (req, res) => {
	const result = await am.replace(req.file)
	res.status(result.code).json(result)
})

module.exports = router
