const config = require('../config')
const BaseManager = require('./BaseManager')
const bm = new BaseManager()
const path = require('path')
const { isImage, isObject } = require('../utils/Util')

class DiaryManager {
	constructor() {
		this.dataDir = path.resolve(config.DATA_DIR) // data配置目录
		this.configFilename = 'diary.ts'
		this.diariesDir = path.resolve(config.DIARIES_DIR) // diary图片目录
		this.publicDir = path.resolve(config.PUBLIC_DIR) // public目录
	}
	// 上传日记图片(支持批量)
	async uploadImages(files) {
		await bm.uploadFiles(this.diariesDir, files, (file) => isImage(file.originalname))
	}
	// 清除旧图片
	async _clearOldImages(data) {
		const configImagePaths = this._getImagePaths(data)
		await bm.clearOldImages(configImagePaths, this.diariesDir)
	}
	// 提取diary.ts内所有图片完整路径
	_getImagePaths(data) {
		if (!isObject(data)) return
		const imagePaths = []
		const diaries = data?.diaryData || []
		diaries.forEach((d) => {
			const images = d?.images || []
			images.forEach((imagePath) => {
				if (!isImage(imagePath)) return // 格式为"/images/diary/xxx.png"
				const filePath = path.resolve(path.join(this.publicDir, imagePath))
				imagePaths.push(filePath)
			})
		})
		return imagePaths
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await bm.getConfigData(this.dataDir, this.configFilename)
	}
	// data转换为config
	async writeConfig(data) {
		return await bm.dataToConfig(this.dataDir, this.configFilename, data, _, { beforeWrite: async () => await this._clearOldImages(data) })
	}
}

module.exports = DiaryManager
