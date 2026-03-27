const config = require('../config')
const fs = require('fs')
const { readFile, writeFile, isImage } = require('../utils/Util')
const path = require('path')
const BaseManager = require('./BaseManager')
const bm = new BaseManager()

class AlbumManager {
	constructor() {
		this.albumsDir = path.resolve(config.ALBUMS_DIR)
		this.infoFilename = 'info.json'
	}
	// 获取相册文件夹列表
	async getAll() {
		try {
			const albums = []
			const albumFolderNames = await fs.promises.readdir(this.albumsDir) // 读取到albums目录下所有的相册文件夹名
			for (const albumFolderName of albumFolderNames) {
				const albumFolderPath = path.join(this.albumsDir, albumFolderName) // 每个相册文件夹路径
				const filenames = await fs.promises.readdir(albumFolderPath)
				const folder = []
				for (const filename of filenames) {
					// 存入相册文件和info.json
					if (!this._isAlbumFile) continue
					const file = await readFile(albumFolderPath, filename)
					folder.push({ file, filePath: path.join(albumFolderPath, filename) })
				}
				albums.push({ folderPath: albumFolderPath, data: folder })
			}
			return { code: 200, success: true, data: albums }
		} catch (err) {
			return { code: 500, success: false, message: '获取相册列表失败', error: err }
		}
	}
	// 上传相册文件(支持批量)
	async uploadFiles(folderPath, files) {
		if (typeof folderPath !== 'string' || !folderPath.length) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
		const absolutePath = path.resolve(folderPath)
		await bm.uploadFiles(absolutePath, files, (file) => isImage(file.originalname))
	}
	// 删除相册文件(支持批量)
	async deleteFiles(filePaths) {
		try {
			if (!filePaths || (Array.isArray(filePaths) && !filePaths.length)) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			for (const filePath of filePaths) {
				const absolutePath = path.resolve(filePath)
				await fs.promises.unlink(absolutePath)
			}
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '删除失败', error: err }
		}
	}
	// 创建相册文件夹
	async createFolder(folderName) {
		try {
			if (typeof folderName !== 'string' || !folderName.length) return { code: 400, success: false, message: '请传入正确的文件夹名' }
			const folderPath = path.join(this.albumsDir, folderName)
			// 创建相册配置文件info.json
			await writeFile(folderPath, this.infoFilename, '')
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '创建失败', error: err }
		}
	}
	// 删除相册文件夹
	async deleteFolder(folderPath) {
		try {
			if (typeof folderPath !== 'string' || !folderPath.length) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			const absolutePath = path.resolve(folderPath)
			await fs.promises.rm(absolutePath, { recursive: true })
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '删除失败', error: err }
		}
	}
	// 更新相册配置文件info.json
	async updateInfo(folderPath, content) {
		try {
			if (typeof folderPath !== 'string' || !folderPath.length) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			if (!content) return { code: 400, success: false, message: '新内容不能为空' }
			const absolutePath = path.resolve(folderPath)
			await writeFile(absolutePath, this.infoFilename, content)
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '修改失败', error: err }
		}
	}
	// 是否为图片且不为info.json
	_isAlbumFile(filename) {
		return isImage(filename) && filename !== this.infoFilename
	}
}

module.exports = AlbumManager
