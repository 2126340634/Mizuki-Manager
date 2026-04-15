const config = require('../config')
const BaseManager = require('./BaseManager')
const path = require('path')
const { isImage, isObject } = require('../utils/Util')

class AnimeManager extends BaseManager {
	constructor() {
		super()
		this.dataDir = path.resolve(config.DATA_DIR) // data配置目录
		this.configFilename = 'anime.ts'
		this.animesDir = path.resolve(config.ANIMES_DIR) // diary图片目录
		this.publicDir = path.resolve(config.PUBLIC_DIR) // public目录
	}
	// 上传动画图片(支持批量)
	async uploadImages(files) {
		return await super.uploadFiles(this.animesDir, files, (file) => isImage(file.originalname))
	}
	// 清除旧图片
	async _clearOldImages(data) {
		const configImagePaths = this._getImagePaths(data)
		return await super.clearOldImages(configImagePaths, this.animesDir)
	}
	// 提取anime.ts内所有图片完整路径
	_getImagePaths(data) {
		if (!isObject(data)) return
		const imagePaths = []
		const animes = data?.projectsData || []
		animes.forEach((a) => {
			const imagePath = a?.cover || '' // 格式为"/assets/anime/xxx.png"
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
		return await super.dataToConfig(this.dataDir, this.configFilename, data, _, { beforeWrite: async () => await this._clearOldImages(data) })
	}
}

module.exports = AnimeManager
