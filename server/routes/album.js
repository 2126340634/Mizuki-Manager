const express = require('express')
const router = express.Router()
const { AlbumManager } = require('../managers/index.js')
const am = new AlbumManager()
const multer = require('multer')
const config = require('../config.js')
const upload = multer({ storage: multer.memoryStorage(), limits: config.MAX_FILE_SIZE })

/**
 * @description 相册文件夹
 */
// 获取相册文件夹列表
router.get('/folders', async (req, res) => {
	const result = await am.getAllFolders()
	res.status(result.code).json(result)
})

// 创建相册文件夹
router.post('/create-folder', async (req, res) => {
	const { folderName } = req?.body || {}
	const result = await am.createFolder(folderName)
	res.status(result.code).json(result)
})

// 删除相册文件夹
router.delete('/folder', async (req, res) => {
	const { folderPath } = req?.body || {}
	const result = await am.deleteFolder(folderPath)
	res.status(result.code).json(result)
})

// 重命名文件夹
router.post('/rename', async (req, res) => {
	const { folderPath, newName } = req?.body || {}
	const result = await am.renameFolder(folderPath, newName)
	res.status(result.code).json(result)
})

/**
 * @description 相册文件
 */
// 获取相册图片列表
router.get('/files', async (req, res) => {
	const { folderPath, pageNum, pageSize } = req?.query || {}
	const result = await am.getFolderFiles(folderPath, pageNum, pageSize)
	res.status(result.code).json(result)
})

// 上传相册文件(支持批量)
router.post('/upload-files', upload.array('files'), async (req, res) => {
	const { folderPath } = req?.body || {}
	const result = await am.uploadFiles(folderPath, req.files)
	res.status(result.code).json(result)
})

// 删除相册文件(支持批量)
router.delete('/files', async (req, res) => {
	const { filePaths } = req?.body || {}
	const result = await am.deleteFiles(filePaths)
	res.status(result.code).json(result)
})

/**
 * @description 相册配置
 */
// 更新相册配置文件info.json
router.get('/info', async (req, res) => {
	const { folderPath } = req?.query || {}
	const result = await am.getInfoContent(folderPath)
	res.status(result.code).json(result)
})

// 更新相册配置文件info.json
router.post('/update-info', async (req, res) => {
	const { folderPath, content } = req?.body || {}
	const result = await am.updateInfo(folderPath, content)
	res.status(result.code).json(result)
})

module.exports = router
