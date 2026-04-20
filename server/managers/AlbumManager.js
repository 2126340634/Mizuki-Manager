const config = require('../config')
const fs = require('fs')
const { readFile, writeFile, isImage, ensureDirExist } = require('../utils/Util')
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
			const dir = await fs.promises.opendir(this.albumsDir)
			for await (const dirent of dir) {
				if (!dirent.isDirectory()) continue
				folders.push({ folderName: dirent.name, folderPath: path.resolve(this.albumsDir, dirent.name) })
			}
			return { code: 200, success: true, data: folders }
		} catch (err) {
			return { code: 500, success: false, message: '获取失败', error: err }
		}
	}
	// 创建相册文件夹
	async createFolder(folderName) {
		try {
			if (typeof folderName !== 'string' || !folderName) return { code: 400, success: false, message: '请传入正确的文件夹名' }
			const folderPath = path.resolve(this.albumsDir, folderName)
			// 创建相册配置文件info.json
			if (await ensureDirExist(folderPath)) {
				return { code: 409, success: false, message: '该目录已存在' }
			}
			await writeFile(folderPath, this.infoFilename, '')
			return { code: 200, success: true, data: { folderPath } }
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
	// 重命名文件夹
	async renameFolder(folderPath, newName) {
		try {
			if (typeof folderPath !== 'string' || !folderPath) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			if (typeof newName !== 'string' || !newName) return { code: 400, success: false, message: '请传入正确的新文件名' }
			if (!/^[a-zA-Z0-9_\-\s]{1,100}$/.test(newName)) return { code: 400, success: false, message: '文件名不能有特殊符号, 长度最大为100个字符' }
			if (!(await ensureDirExist(folderPath))) {
				return { code: 409, success: false, message: '未找到该目录' }
			}
			const newFolderPath = path.resolve(config.ALBUMS_DIR, newName)
			await fs.promises.rename(folderPath, newFolderPath)
			return { code: 200, success: true, data: { folderPath: newFolderPath } }
		} catch (err) {
			return { code: 500, success: false, message: '重命名失败', error: err }
		}
	}

	/**
	 * @description 相册文件
	 */

	// 获取相册内所有图片(分页)
	async getFolderFiles(folderPath, pageNum, pageSize) {
		try {
			if (pageNum === undefined) return { code: 400, success: false, message: '请传入正确的pageNum' }
			if (pageSize === undefined) return { code: 400, success: false, message: '请传入正确的pageSize' }
			if (typeof folderPath !== 'string' || !folderPath) return { code: 400, success: false, message: '请传入正确的文件夹路径' }
			const files = []
			const allFilenames = await fs.promises.readdir(folderPath) // 所有文件
			const imgFilenames = allFilenames.filter(isImage) // 筛选图片文件
			const filesWithTime = await Promise.all(
				imgFilenames.map(async (filename) => {
					const absolutePath = path.resolve(folderPath, filename)
					return {
						filename,
						filePath: absolutePath,
						mtime: (await fs.promises.stat(absolutePath)).mtime.getTime()
					}
				})
			)
			filesWithTime.sort((a, b) => b.mtime - a.mtime)
			const slicedFiles = filesWithTime.slice((pageNum - 1) * pageSize, pageNum * pageSize).map(({ filename, filePath }) => ({ filename, filePath })) // 分页文件
			for (const file of slicedFiles) {
				const { filename, filePath } = file
				const url = `/public${filePath.split('public', 2)[1].replaceAll('\\', '/')}`
				files.push({ filename, filePath, url })
			}
			return { code: 200, success: true, data: { files, total: imgFilenames.length } }
		} catch (err) {
			return { code: 500, success: false, message: '获取失败', error: err }
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
			const tasks = []
			for (const filePath of filePaths) {
				const absolutePath = path.resolve(filePath)
				tasks.push(fs.promises.unlink(absolutePath))
			}
			const result = (await Promise.allSettled(tasks)).map((res, index) => ({ res, filePath: filePaths[index] }))
			const errors = result.filter(({ res }) => res.status === 'rejected')
			if (errors.length) return { code: 500, success: false, message: `删除失败: ${errors.map(({ filePath }) => filePath).join('、')}`, error: errors }
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
					return { code: 200, success: true, data: '', message: '配置文件不存在, 已自动创建' }
				}
				throw err
			}
		} catch (err) {
			return { code: 500, success: false, message: '获取失败', error: err }
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
