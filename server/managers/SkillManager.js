const config = require('../config')
const path = require('path')
const BaseManager = require('./BaseManager')
const bm = new BaseManager()

class SkillManager {
	constructor() {
		this.dataDir = path.resolve(config.DATA_DIR) // data配置目录
		this.configFilename = 'skills.ts'
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await bm.getConfigData(this.dataDir, this.configFilename)
	}
	// data转换为config
	async writeConfig(data) {
		return await bm.dataToConfig(this.dataDir, this.configFilename, data)
	}
}

module.exports = SkillManager
