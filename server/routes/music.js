const express = require('express')
const router = express.Router()
const { MusicManager } = require('../managers/index.js')
const mm = new MusicManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage(), limits: config.MAX_FILE_SIZE })

// 上传音乐(封面,音频文件)
router.post(
	'/upload',
	upload.fields([
		{ name: 'cover', maxCount: 1 },
		{ name: 'music', maxCount: 1 }
	]),
	async (req, res) => {
		const result = await mm.uploadMusic(req?.files?.cover?.[0], req?.files?.music?.[0])
		res.status(result.code).json(result)
	}
)

// 获取配置数据
router.get('/', async (req, res) => {
	const result = await mm.getConfigData()
	res.status(result.code).json(result)
})

// 写入新配置数据
router.post('/write', async (req, res) => {
	const { data } = req?.body || {}
	const result = await mm.writeConfig(data)
	res.status(result.code).json(result)
})

module.exports = router
