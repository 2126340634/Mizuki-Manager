const config = require('../config.js')
const { readFile, fileExists, writeFile } = require('../utils/Util.js')
const path = require('path')

class AboutManager {
	constructor() {
		this.aboutDir = path.resolve(config.ABOUT_DIR)
		this.aboutFilename = 'about.md'
	}
	// 获取about内容
	async getContent() {
		try {
			const content = await readFile(this.aboutDir, this.aboutFilename, 'utf8')
			return {
				code: 200,
				success: true,
				data: content
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '文件读取失败',
				error: err
			}
		}
	}
	// 替换about.md
	async replace(file) {
		try {
			if (!file)
				return {
					code: 400,
					success: false,
					message: '请上传文件'
				}
			if (!file.originalname.endsWith('.md'))
				return {
					code: 400,
					success: false,
					message: '请上传.md格式文件'
				}
			await writeFile(this.aboutDir, this.aboutFilename, file.buffer)
			return {
				code: 200,
				success: true
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '替换失败',
				error: err
			}
		}
	}
	// 更新about
	async update(content) {
		try {
			if (typeof content !== 'string' || !content)
				return {
					code: 400,
					success: false,
					message: '请正确输入新内容'
				}
			if (!(await fileExists(this.aboutDir, this.aboutFilename)))
				return {
					code: 404,
					success: false,
					message: '文件不存在'
				}
			await writeFile(this.aboutDir, this.aboutFilename, content)
			return {
				code: 200,
				success: true
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '修改失败',
				error: err
			}
		}
	}
}

module.exports = AboutManager
