const path = require('path')

// 项目根目录
const BASE_PATH = path.resolve('C:/Users/Administrator/Desktop/Mizuki-master')
// 项目部署路径
const DEPLOY_DIR = path.resolve('C:/Users/Administrator/Desktop/Mizuki-master/dist')
// public目录
const PUBLIC_DIR = path.join(BASE_PATH, 'public')

module.exports = {
	BASE_PATH,
	PUBLIC_DIR,
	DEPLOY_DIR,
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
	// dist打包目录
	DIST_DIR: (() => path.join(BASE_PATH, 'dist'))(),
	// 包管理工具 可选: pnpm | npm | yarn
	PACKAGE_TOOL: 'pnpm',
	// 单个文件限制10MB
	MAX_FILE_SIZE: 10 * 1024 * 1024,
	// 运行端口
	PORT: 3000
}
