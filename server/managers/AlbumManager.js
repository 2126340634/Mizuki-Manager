const config = require('../config')
const fs = require('fs')
const { readFile, writeFile, isImage } = require('../utils/Util')
const path = require('path')
const BaseManager = require('./BaseManager')

class AlbumManager extends BaseManager {
	constructor() {
		super()
		this.albumsDir = path.resolve(config.ALBUMS_DIR)
		this.infoFilename = 'info.json'
	}

	/**
	 * @description 相册文件夹
	 */

	// 获取相册文件夹列表
	async getAllFolders() {
		try {
			const folders = []
			const folderNames = await fs.promises.readdir(this.albumsDir) // 读取到albums目录下所有的相册文件夹名
			for (const folderName of folderNames) {
				const folderPath = path.resolve(this.albumsDir, folderName) // 每个相册文件夹路径
				if (!(await fs.promises.stat(folderPath)).isDirectory()) continue // 跳过非文件夹
				folders.push({ folderName, folderPath })
			}
			return { code: 200, success: true, data: folders }
		} catch (err) {
			return { code: 500, success: false, message: '获取相册文件夹列表失败', error: err }
		}
	}
	// 创建相册文件夹
	async createFolder(folderName) {
		try {
			if (typeof folderName !== 'string' || !folderName) return { code: 400, success: false, message: '请传入正确的文件夹名' }
			const folderPath = path.resolve(this.albumsDir, folderName)
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
			if (typeof folderPath !== 'string' || !folderPath) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			const absolutePath = path.resolve(folderPath)
			await fs.promises.rm(absolutePath, { recursive: true, force: true })
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '删除失败', error: err }
		}
	}

	/**
	 * @description 相册文件
	 */

	// 获取相册内所有图片(分页)
	async getFolderFiles(folderPath, pageNum = 1, pageSize = 10) {
		try {
			if (typeof folderPath !== 'string' || !folderPath) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			const files = []
			const allFilenames = await fs.promises.readdir(folderPath) // 所有文件
			const filenames = allFilenames.filter(isImage) // 筛选图片文件
			const slicedFilenames = filenames.slice((pageNum - 1) * pageSize, pageNum * pageSize) // 分页文件
			for (const filename of slicedFilenames) {
				const filePath = path.resolve(folderPath, filename)
				const url = `/public${filePath.split('public', 2)[1].replaceAll('\\', '/')}`
				files.push({ filename, filePath, url })
			}
			return { code: 200, success: true, data: { files, total: filenames.length } }
		} catch (err) {
			return { code: 500, success: false, message: '获取相册图片列表失败', error: err }
		}
	}
	// 上传相册文件(支持批量)
	async uploadFiles(folderPath, files) {
		if (typeof folderPath !== 'string' || !folderPath) return { code: 400, success: false, message: `请传入正确的文件夹路径` }
		const absolutePath = path.resolve(folderPath)
		return await super.uploadFiles(absolutePath, files, (file) => isImage(file.originalname))
	}
	// 删除相册文件(支持批量)
	async deleteFiles(filePaths) {
		try {
			if (!filePaths || (Array.isArray(filePaths) && !filePaths.length)) return { code: 400, success: false, message: '请传入正确的文件路径' }
			for (const filePath of filePaths) {
				const absolutePath = path.resolve(filePath)
				await fs.promises.unlink(absolutePath)
			}
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '删除失败', error: err }
		}
	}

	/**
	 * @description 相册配置
	 */

	// 获取相册配置文件info.json内容
	async getInfoContent(folderPath) {
		try {
			if (typeof folderPath !== 'string' || !folderPath) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			const absolutePath = path.resolve(folderPath)
			try {
				const content = await readFile(absolutePath, this.infoFilename, 'utf8')
				return { code: 200, success: true, data: content }
			} catch (err) {
				if (err.code === 'ENOENT') {
					// 文件不存在时主动创建
					await writeFile(folderPath, this.infoFilename, '')
					return { code: 200, success: true, data: '', message: '文件不存在, 已自动创建' }
				}
				throw err
			}
		} catch (err) {
			return { code: 500, success: false, message: '文件读取失败', error: err }
		}
	}
	// 更新相册配置文件info.json
	async updateInfo(folderPath, content) {
		try {
			if (typeof folderPath !== 'string' || !folderPath) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			if (!content) return { code: 400, success: false, message: '新内容不能为空' }
			const absolutePath = path.resolve(folderPath)
			await writeFile(absolutePath, this.infoFilename, content)
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '修改失败', error: err }
		}
	}
}

module.exports = AlbumManager
