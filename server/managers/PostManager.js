const fs = require('fs')
const config = require('../config.js')
const { readFile, fileExists, writeFile, deleteFile, isMarkdown } = require('../utils/Util.js')
const path = require('path')
const BaseManager = require('./BaseManager.js')

class PostManager extends BaseManager {
	constructor() {
		super()
		this.postsDir = path.resolve(config.POSTS_DIR)
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
			// 按最新修改时间排序
			filesWithTime.sort((a, b) => b.mtime - a.mtime)
			const slicedFilenames = filesWithTime.slice((pageNum - 1) * pageSize, pageNum * pageSize).map((f) => f.filename)
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
			return { code: 200, success: true, data: content }
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
			await super.uploadFiles(this.postsDir, [file], (cbFile) => isMarkdown(cbFile.originalname))
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '上传失败', error: err }
		}
	}
	// 删除文章
	async delete(filename) {
		try {
			if (typeof filename !== 'string' || !filename) return { code: 400, success: false, message: '请传入正确的文件' }
			if (!isMarkdown(filename)) return { code: 400, success: false, message: '请传入正确的文件' }
			if (!(await fileExists(this.postsDir, filename))) return { code: 404, success: false, message: '文件不存在' }
			await deleteFile(this.postsDir, filename)
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '删除失败', error: err }
		}
	}
}

module.exports = PostManager
