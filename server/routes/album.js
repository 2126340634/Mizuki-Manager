const express = require('express')
const router = express.Router()
const { AlbumManager } = require('../managers/index.js')
const am = new AlbumManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage, limits: config.MAX_FILE_SIZE })

// 获取相册文件夹列表
router.get('/', async (req, res) => {
	const result = await am.getAll()
	res.status(result.code).json(result)
})

/**
 * @description 相册文件
 */
// 上传相册文件(支持批量)
router.post('/upload-files', upload.array('files'), async (req, res) => {
	const { folderPath } = req.body
	const result = await am.uploadFiles(folderPath, req.files)
	res.status(result.code).json(result)
})

// 删除相册文件(支持批量)
router.delete('/files', async (req, res) => {
	const { filePaths } = req.query
	const result = await am.deleteFiles(filePaths)
	res.status(result.code).json(result)
})

/**
 * @description 相册文件夹
 */
// 创建相册文件夹
router.post('/create-folder', async (req, res) => {
	const { folderName } = req.body
	const result = await am.createFolder(folderName)
	res.status(result.code).json(result)
})

// 删除相册文件夹
router.delete('/folder', async (req, res) => {
	const { folderPath } = req.query
	const result = await am.deleteFolder(folderPath)
	res.status(result.code).json(result)
})

/**
 * @description 相册配置
 */
// 更新相册配置文件info.json
router.post('/update-info', async (req, res) => {
	const { folderPath, content } = req.body
	const result = await am.updateInfo(folderPath, content)
	res.status(result.code).json(result)
})

module.exports = router
