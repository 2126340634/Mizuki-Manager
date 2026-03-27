const path = require('path')
const config = require('../config.js')
const BaseManager = require('./BaseManager')
const bm = new BaseManager()
const { writeFile } = require('../utils/Util.js')

class ConfigManager {
	constructor() {
		this.configDir = path.resolve(config.CONFIG_DIR)
		this.configFilename = 'config.ts'
	}
	// 替换Config文件
	async replace(file) {
		try {
			if (!file) return { code: 400, success: false, message: '请上传文件' }
			if (!file.originalname.endsWith('.ts')) return { code: 400, success: false, message: '请上传.ts格式文件' }
			await writeFile(this.configDir, this.configFilename, file.buffer)
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '替换失败', error: err }
		}
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await bm.getConfigData(this.configDir, this.configFilename)
	}
	// data转换为config
	async writeConfig(data) {
		return await bm.dataToConfig(this.configDir, this.configFilename, data)
	}
}

module.exports = ConfigManager
