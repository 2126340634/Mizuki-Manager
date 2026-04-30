const path = require('path')
const config = require('../config.js')
const BaseManager = require('./BaseManager')
const { writeFile, isObject, isImage } = require('../utils/Util.js')

class ConfigManager extends BaseManager {
	constructor() {
		super()
		this.configDir = path.resolve(config.CONFIG_DIR)
		this.configFilename = 'config.ts'
		this.publicDir = path.resolve(config.PUBLIC_DIR)
		this.srcDir = path.resolve(config.SRC_DIR)
		this.homeDir = path.resolve(config.HOME_DIR)
		this.pcWallpapersDir = path.resolve(config.PC_WALLPAPERS_DIR)
		this.mobileWallpapersDir = path.resolve(config.MOBILE_WALLPAPERS_DIR)
		this.avatarDir = path.resolve(config.AVATAR_DIR)
	}
	// 上传图标或Logo
	async uploadHomeImages(files) {
		return await super.uploadFiles(this.homeDir, files, (file) => isImage(file.originalname), { skipIfExists: true })
	}
	// 上传PC壁纸
	async uploadPCWallpapers(files) {
		return await super.uploadFiles(this.pcWallpapersDir, files, (file) => isImage(file.originalname), { skipIfExists: true })
	}
	// 上传到移动端壁纸
	async uploadMobileWallpapers(files) {
		return await super.uploadFiles(this.mobileWallpapersDir, files, (file) => isImage(file.originalname), { skipIfExists: true })
	}
	// 上传到头像目录
	async uploadAvatarImages(files) {
		return await super.uploadFiles(this.avatarDir, files, (file) => isImage(file.originalname), { basePath: 'src', skipIfExists: true })
	}
	// 清除旧图片
	async _clearOldImages(data) {
		const dataImagePaths = this._getImagePaths(data) // 获取配置data内所有图片路径
		for (const imgPath of [this.homeDir, this.pcWallpapersDir, this.mobileWallpapersDir, this.avatarDir]) {
			await super.clearOldImages(dataImagePaths, imgPath)
		}
		return true
	}
	// 提取config内所有图片完整路径
	_getImagePaths(data) {
		if (!isObject(data)) return
		const imagePaths = []
		const _getPath = (path) => {
			if (path?.startsWith('/')) {
				path = path.substring(1)
			}
			return path
		}
		const _solvePublicPath = (imagePath) => {
			if (!imagePath) return ''
			// imagePath格式为"assets/mobile-banner(desktop-banner)/xxx.png"
			imagePath = _getPath(imagePath)
			if (!isImage(imagePath)) return
			const filePath = path.resolve(this.publicDir, imagePath)
			imagePaths.push(filePath)
		}

		// 获取Icon图片路径
		const iconPath = _getPath(data?.siteConfig?.value?.navbarTitle?.value?.icon?.value)
		if (isImage(iconPath)) imagePaths.push(path.resolve(this.publicDir, iconPath))

		// 获取Logo图片路径
		const logoPath = _getPath(data?.siteConfig?.value?.navbarTitle?.value?.logo?.value)
		if (isImage(logoPath)) imagePaths.push(path.resolve(this.publicDir, logoPath))

		// 获取PC全屏和横幅图片路径
		const desktopBanners = data?.siteConfig?.value?.banner?.value?.src?.value?.desktop?.value || []
		const desktopFullscreen = data?.fullscreenWallpaperConfig?.value?.src?.value?.desktop?.value || []
		desktopBanners.forEach(_solvePublicPath)
		desktopFullscreen.forEach(_solvePublicPath)

		// 获取移动端全屏和横幅图片路径
		const mobileBanners = data?.siteConfig?.value?.banner?.value?.src?.value?.mobile?.value || []
		const mobileFullscreen = data?.fullscreenWallpaperConfig?.value?.src?.value?.mobile?.value || []
		mobileBanners.forEach(_solvePublicPath)
		mobileFullscreen.forEach(_solvePublicPath)

		// 获取头像图片路径
		const avatarPath = _getPath(data?.profileConfig?.value?.avatar?.value) // 格式为"src/assets/images/xxx.webp"
		if (isImage(avatarPath)) imagePaths.push(path.resolve(this.srcDir, avatarPath)) // 注意头像图片在src下

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
