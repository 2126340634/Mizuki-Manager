const path = require('path')

const BASE_PATH = 'C:/Users/Administrator/Desktop/Mizuki-manager'
const PUBLIC_DIR = path.join(BASE_PATH, 'public')

module.exports = {
	// 项目根目录
	BASE_PATH,
	// public目录
	PUBLIC_DIR,
	// .md文章目录
	POSTS_DIR: (() => path.join(BASE_PATH, 'src/content/posts'))(),
	// about.md目录
	ABOUT_DIR: (() => path.join(BASE_PATH, 'src/content/spec'))(),
	// config目录
	CONFIG_DIR: (() => path.join(BASE_PATH, 'src'))(),
	// 相册图片目录
	ALBUMS_DIR: (() => path.join(PUBLIC_DIR, 'images/albums'))(),
	// 相册文件格式
	IMAGE_FORMATS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff', '.tif'],
	// data配置目录
	DATA_DIR: (() => path.join(BASE_PATH, 'src/data'))(),
	// 设备图片目录
	DEVICES_DIR: (() => path.join(PUBLIC_DIR, 'images/device'))(),
	// 日记图片目录
	DIARIES_DIR: (() => path.join(PUBLIC_DIR, 'images/diary'))(),
	// 项目封面图片目录
	PROJECTS_DIR: (() => path.join(PUBLIC_DIR, 'images/project'))(),
	// 动画封面图片目录
	ANIMES_DIR: (() => path.join(PUBLIC_DIR, 'assets/anime'))(),
	// 单个文件限制10MB
	MAX_FILE_SIZE: 10 * 1024 * 1024,
	// 运行端口
	PORT: 3000,
	// mizuki项目部署的baseURL
	FRONTEND_URL: 'http://localhost:4321'
}
