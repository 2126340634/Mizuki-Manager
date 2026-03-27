const fs = require('fs')
const config = require('../config.js')
const { readFile, fileExists, writeFile, deleteFile } = require('../utils/Util.js')
const path = require('path')
const BaseManager = require('./BaseManager.js')
const bm = new BaseManager()

class PostManager {
	constructor() {
		this.postsDir = path.resolve(config.POSTS_DIR)
	}
	// 获取全部文章.md文件名列表
	async getAll() {
		try {
			const posts = []
			const filenames = await fs.promises.readdir(this.postsDir, 'utf8')
			for (const filename of filenames) {
				if (!filename.endsWith('.md')) continue
				posts.push(filename)
			}
			return { code: 200, success: true, data: posts }
		} catch (err) {
			return { code: 500, success: false, message: '获取所有文章失败', error: err }
		}
	}
	// 获取单个文章内容
	async getContent(filename) {
		try {
			const content = await readFile(this.postsDir, filename)
			return { code: 200, success: true, data: content }
		} catch (err) {
			return { code: 500, success: false, message: '文件读取失败', error: err }
		}
	}
	// 更新文章
	async update(filename, content) {
		try {
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
			if (await fileExists(this.postsDir, file.originalname)) return { code: 400, success: false, message: '当前名称的文件已存在' }
			await writeFile(this.postsDir, filename, content)
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '添加失败', error: err }
		}
	}
	// 上传文章
	async upload(file) {
		try {
			await bm.uploadFiles(this.postsDir, [file], (cbFile) => cbFile.originalname.endsWith('.md'))
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '上传失败', error: err }
		}
	}
	// 删除文件
	async delete(filename) {
		try {
			if (!filename.length || filename.endsWith('.md')) return { code: 400, success: false, message: '请使用正确的文件名' }
			if (!(await fileExists(this.postsDir, filename))) return { code: 404, success: false, message: '文件不存在' }
			await deleteFile(this.postsDir, filename)
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '删除失败', error: err }
		}
	}
}

module.exports = PostManager
