const path = require('path')
const config = require('../config.js')
const BaseManager = require('./BaseManager')
const { writeFile } = require('../utils/Util.js')

class ConfigManager extends BaseManager {
	constructor() {
		super()
		this.configDir = path.resolve(config.CONFIG_DIR)
		this.configFilename = 'config.ts'
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await super.getConfigData(this.configDir, this.configFilename)
	}
	// data转换为config
	async writeConfig(data) {
		return await super.dataToConfig(this.configDir, this.configFilename, data)
	}
}

module.exports = ConfigManager
