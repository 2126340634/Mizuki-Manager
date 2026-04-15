const config = require('../config')
const path = require('path')
const BaseManager = require('./BaseManager')
const { isImage, isObject } = require('../utils/Util')

class DeviceManager extends BaseManager {
	constructor() {
		super()
		this.dataDir = path.resolve(config.DATA_DIR) // data配置目录
		this.configFilename = 'devices.ts'
		this.devicesDir = path.resolve(config.DEVICES_DIR) // device图片目录
		this.publicDir = path.resolve(config.PUBLIC_DIR) // public目录
	}
	// 上传设备图片(支持批量)
	async uploadImages(files) {
		return await super.uploadFiles(this.devicesDir, files, (file) => isImage(file.originalname))
	}
	// 清除旧图片
	async _clearOldImages(data) {
		const configImagePaths = this._getImagePaths(data)
		return await super.clearOldImages(configImagePaths, this.devicesDir)
	}
	// 提取devices.ts内所有图片完整路径
	_getImagePaths(data) {
		if (!isObject(data)) return
		const imagePaths = []
		const devices = data?.devicesData || {}
		Object.keys(devices).forEach((key) => {
			const device = devices[key] || []
			device.forEach((d) => {
				const imagePath = d?.image || '' // 格式为"/images/device/xxx.png"
				if (!isImage(imagePath)) return
				const filePath = path.resolve(this.publicDir, imagePath)
				imagePaths.push(filePath)
			})
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

module.exports = DeviceManager
