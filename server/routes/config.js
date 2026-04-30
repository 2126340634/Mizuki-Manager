const express = require('express')
const router = express.Router()
const { ConfigManager } = require('../managers/index.js')
const cm = new ConfigManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage(), limits: config.MAX_FILE_SIZE })

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

// 上传Icon或Logo图片
router.post('/upload-home', upload.single('file'), async (req, res) => {
	const result = await cm.uploadHomeImages(req?.file ? [req.file] : [])
	res.status(result.code).json(result)
})

// 上传PC壁纸(批量)
router.post('/upload-pc', upload.array('files'), async (req, res) => {
	const result = await cm.uploadPCWallpapers(req?.files)
	res.status(result.code).json(result)
})

// 上传移动端壁纸(批量)
router.post('/upload-mobile',upload.array('files'), async (req, res) => {
	const result = await cm.uploadMobileWallpapers(req?.files)
	res.status(result.code).json(result)
})

// 上传头像图片
router.post('/upload-avatar', upload.single('file'), async (req, res) => {
	const result = await cm.uploadAvatarImages(req?.file ? [req.file] : [])
	res.status(result.code).json(result)
})

module.exports = router
