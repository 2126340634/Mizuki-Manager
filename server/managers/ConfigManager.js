const path = require('path')
const config = require('../config.js')
const BaseManager = require('./BaseManager')
const { writeFile } = require('../utils/Util.js')

class ConfigManager extends BaseManager {
	constructor() {
		super()
		this.configDir = path.resolve(config.CONFIG_DIR)
		this.configFilename = 'config.ts'
		this.publicDir = path.resolve(config.PUBLIC_DIR)
		this.homeDir = path.resolve(config.HOME_DIR)
	}
	// 上传到/public/assets/home
	async uploadHomeImages(files) {
		return await super.uploadFiles(this.homeDir, files, (file) => isImage(file.originalname))
	}

	// 清除旧图片
	async _clearOldImages(data) {
		const configImagePaths = this._getImagePaths(data)
		return await super.clearOldImages(configImagePaths, this.devicesDir)
	}
	// 提取config内所有图片完整路径
	_getImagePaths(data) {
		if (!isObject(data)) return
		const imagePaths = []
		const devices = data?.devicesData || {}
		Object.keys(devices).forEach((key) => {
			const device = devices[key] || []
			device.forEach((d) => {
				let imagePath = d?.image || '' // 格式为"/images/device/xxx.png"
				if (imagePath.startsWith('/')) {
					imagePath = imagePath.substring(1)
				}
				if (!isImage(imagePath)) return
				const filePath = path.resolve(this.publicDir, imagePath)
				imagePaths.push(filePath)
			})
		})
		return imagePaths
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await super.getConfigData(this.configDir, this.configFilename, undefined, { wrap: true })
	}
	// data转换为config
	async writeConfig(data) {
		return await super.dataToConfig(this.configDir, this.configFilename, data, undefined, { unwrap: true, beforeWrite: async () => await this._clearOldImages(data) })
	}
}

module.exports = ConfigManager
