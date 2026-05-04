const fs = require('fs')
const config = require('../config.js')
const { readFile, fileExists, writeFile, deleteFile, isMarkdown, isLegalFilename, ensureDirExist } = require('../utils/Util.js')
const path = require('path')
const BaseManager = require('./BaseManager.js')

class PostManager extends BaseManager {
	constructor() {
		super()
		this.postsDir = path.resolve(config.POSTS_DIR)
		this.total = 0 // 缓存总文章数
	}
	// 获取全部文章Markdown文件名列表
	async getAll(pageNum, pageSize) {
		try {
			const allFilenames = await fs.promises.readdir(this.postsDir)
			const mdFiles = allFilenames.filter(isMarkdown)
			const filesWithTime = await Promise.all(
				mdFiles.map(async (filename) => ({
					filename,
					mtime: (await fs.promises.stat(path.resolve(this.postsDir, filename))).mtime.getTime()
				}))
			)
			// 按最新修改时间倒序
			filesWithTime.sort((a, b) => b.mtime - a.mtime)
			const slicedFilenames = filesWithTime.slice((pageNum - 1) * pageSize, pageNum * pageSize).map((f) => f.filename)
			this.total = mdFiles.length
			return { code: 200, success: true, data: { posts: slicedFilenames, total: mdFiles.length } }
		} catch (err) {
			return { code: 500, success: false, message: '获取所有文章失败', error: err }
		}
	}
	// 获取单个文章内容
	async getContent(filename) {
		try {
			if (typeof filename !== 'string' || !filename) return { code: 400, success: false, message: '请传入正确的文件' }
			const content = await readFile(this.postsDir, filename)
			return { code: 200, success: true, data: content.toString() }
		} catch (err) {
			return { code: 500, success: false, message: '文件读取失败', error: err }
		}
	}
	// 更新文章
	async update(filename, content) {
		try {
			if (typeof filename !== 'string' || !filename) return { code: 400, success: false, message: '请传入正确的文件' }
			if (!content) return { code: 400, success: false, message: '新内容不能为空' }
			if (!(await fileExists(this.postsDir, filename))) return { code: 404, success: false, message: '文件不存在' }
			await writeFile(this.postsDir, filename, content)
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '修改失败', error: err }
		}
	}
	// 创建文章
	async create(filename, content) {
		try {
			if (typeof filename !== 'string' || !filename) return { code: 400, success: false, message: '请传入正确的文件' }
			if (!content) return { code: 400, success: false, message: '新内容不能为空' }
			if (await fileExists(this.postsDir, filename)) return { code: 400, success: false, message: '当前名称的文件已存在' }
			await writeFile(this.postsDir, filename, content)
			return { code: 200, success: true, data: { filename } }
		} catch (err) {
			console.error(err)
			return { code: 500, success: false, message: '添加失败', error: err }
		}
	}
	// 上传文章
	async upload(file) {
		return await super.uploadFiles(this.postsDir, [file], (cbFile) => isMarkdown(cbFile.originalname))
	}
	// 删除文章
	async delete(filename) {
		try {
			if (typeof filename !== 'string' || !filename) return { code: 400, success: false, message: '请传入正确的文件' }
			if (!isMarkdown(filename)) return { code: 400, success: false, message: '请传入正确的文件' }
			if (!(await fileExists(this.postsDir, filename))) return { code: 404, success: false, message: '文件不存在' }
			await deleteFile(this.postsDir, filename)
			this.total--
			return { code: 200, success: true, data: { total: this.total } }
		} catch (err) {
			return { code: 500, success: false, message: '删除失败', error: err }
		}
	}
	// 重命名文章 filename为带.md后缀的文件, newName不带后缀
	async rename(filename, newName) {
		try {
			if (typeof filename !== 'string' || !filename) return { code: 400, success: false, message: '请传入正确的文件名' }
			if (typeof newName !== 'string' || !newName) return { code: 400, success: false, message: '请传入正确的新文件名' }
			if (!isMarkdown(filename)) return { code: 400, success: false, message: '请传入.md格式的文件名' }
			if (!isLegalFilename(newName)) return { code: 400, success: false, message: '文章名称不能有特殊符号, 长度最大为100个字符' }
			newName += '.md'
			if (!(await fileExists(config.POSTS_DIR, filename))) {
				return { code: 404, success: false, message: '未找到该文件' }
			}
			const oldFilePath = path.resolve(config.POSTS_DIR, filename)
			const newFilePath = path.resolve(config.POSTS_DIR, newName)
			await fs.promises.rename(oldFilePath, newFilePath)
			return { code: 200, success: true, data: { filename: newName } }
		} catch (err) {
			return { code: 500, success: false, message: '重命名失败', error: err }
		}
	}
}

module.exports = PostManager
