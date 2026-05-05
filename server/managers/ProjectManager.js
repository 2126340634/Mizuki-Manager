const config = require('../config')
const BaseManager = require('./BaseManager')
const path = require('path')
const { isImage, isObject } = require('../utils/Util')

class ProjectManager extends BaseManager {
	constructor() {
		super()
		this.dataDir = path.resolve(config.DATA_DIR) // data配置目录
		this.configFilename = 'projects.ts'
		this.projectsDir = path.resolve(config.PROJECTS_DIR) // project图片目录
		this.publicDir = path.resolve(config.PUBLIC_DIR) // public目录
	}
	// 上传项目封面图片(支持批量)
	async uploadImages(files) {
		return await super.uploadFiles(this.projectsDir, files, file => isImage(file.originalname), {
			skipIfExists: true
		})
	}
	// 清除旧图片
	async _clearOldImages(data) {
		const configImagePaths = this._getImagePaths(data)
		return await super.clearOldImages(configImagePaths, this.projectsDir)
	}
	// 提取projects.ts内所有图片完整路径
	_getImagePaths(data) {
		if (!isObject(data)) return []
		const imagePaths = []
		const projects = data?.projectsData || []
		projects.forEach(p => {
			let imagePath = p?.image || '' // 格式为"/images/project/xxx.png"
			if (imagePath.startsWith('/')) {
				imagePath = imagePath.substring(1)
			}
			if (!isImage(imagePath)) return
			const filePath = path.resolve(this.publicDir, imagePath)
			imagePaths.push(filePath)
		})
		return imagePaths
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await super.getConfigData(this.dataDir, this.configFilename)
	}
	// data转换为config
	async writeConfig(data) {
		return await super.dataToConfig(this.dataDir, this.configFilename, data, undefined, {
			beforeWrite: async () => await this._clearOldImages(data)
		})
	}
}

module.exports = ProjectManager
