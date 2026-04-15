const config = require('../config')
const path = require('path')
const BaseManager = require('./BaseManager')

class TimelineManager extends BaseManager {
	constructor() {
		super()
		this.dataDir = path.resolve(config.DATA_DIR) // data配置目录
		this.configFilename = 'timeline.ts'
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await super.getConfigData(this.dataDir, this.configFilename)
	}
	// data转换为config
	async writeConfig(data) {
		return await super.dataToConfig(this.dataDir, this.configFilename, data)
	}
}

module.exports = TimelineManager
