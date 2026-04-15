const config = require('../config')
const BaseManager = require('./BaseManager')
const path = require('path')
const { isImage, isObject, isMusic } = require('../utils/Util')

class ProjectManager extends BaseManager {
	constructor() {
		super()
		this.dataDir = path.resolve(config.MUSIC_DATA_DIR) // 音乐配置目录
		this.configFilename = 'constants.ts'
		this.coverDir = path.resolve(config.MUSIC_COVER_DIR) // 音乐封面目录
		this.urlDir = path.resolve(config.MUSIC_URL_DIR) // 音乐文件目录
		this.publicDir = path.resolve(config.PUBLIC_DIR) // public目录
	}
	// 上传音乐(封面,音频文件)
	async uploadMusic(coverFile, urlFile) {
		return await super.uploadFiles(this.coverDir, [coverFile, urlFile], (file, index) => {
			if (index === 0 && !isImage(file.originalname)) return false
			if (index === 1 && !isMusic(file.originalname)) return false
			return true
		})
	}
	// 清除旧音乐(封面,音频文件)
	async _clearOldMusic(data) {
		const music = this._getMusicPaths(data)
		const clearCovers = super.clearOldImages(music.coverPaths, this.coverDir)
		const clearMusics = super.clearOldMusic(music.urlPaths, this.urlDir)
		return await Promise.allSettled([clearCovers, clearMusics])
	}
	// 提取constants.ts内所有音乐(封面,音频文件)的完整路径
	_getMusicPaths(data) {
		if (!isObject(data)) return []
		const coverPaths = []
		const urlPaths = []
		const list = data?.LOCAL_PLAYLIST || []
		list.forEach((item) => {
			const coverPath = item?.cover || '' // 封面格式为"assets/music/cover/xxx.png"
			const urlPath = item?.url || '' // 音频格式为"assets/music/url/xxx.mp3"
			if (isImage(coverPath)) coverPaths.push(path.resolve(this.publicDir, coverPath))
			if (isMusic(urlPath)) urlPaths.push(path.resolve(this.publicDir, urlPath))
		})
		return { coverPaths, urlPaths }
	}
	// 解析ast树获取关键字段数据
	async getConfigData() {
		return await super.getConfigData(this.dataDir, this.configFilename)
	}
	// data转换为config
	async writeConfig(data) {
		return await super.dataToConfig(this.dataDir, this.configFilename, data, _, { beforeWrite: async () => await this._clearOldMusic(data) })
	}
}

module.exports = ProjectManager
