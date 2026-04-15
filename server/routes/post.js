const express = require('express')
const router = express.Router()
const { PostManager } = require('../managers/index.js')
const pm = new PostManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage, limits: config.MAX_FILE_SIZE })

// 获取全部文章
router.get('/', async (req, res) => {
	const result = await pm.getAll()
	res.status(result.code).json(result)
})

// 获取单个文章内容
router.get('/content', async (req, res) => {
	const { filename } = req?.query || {}
	const result = await pm.getContent(filename)
	res.status(result.code).json(result)
})

// 更新文章
router.post('/update', async (req, res) => {
	const { filename, content } = req?.body || {}
	const result = await pm.update(filename, content)
	res.status(result.code).json(result)
})

// 创建文章
router.post('/create', async (req, res) => {
	const { filename, content } = req?.body || {}
	const result = await pm.create(filename, content)
	res.status(result.code).json(result)
})

// 上传文章
router.post('/upload', upload.single('file'), async (req, res) => {
	const result = await pm.upload(req?.file)
	res.status(result.code).json(result)
})

// 删除文章
router.delete('/', async (req, res) => {
	const { filename } = req?.query || {}
	const result = await pm.delete(filename)
	res.status(result.code).json(result)
})

module.exports = router
