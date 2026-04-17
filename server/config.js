const path = require('path')
require('dotenv').config()

// 项目根目录
const BASE_PATH = path.resolve(process.env.BASE_PATH)
// public目录
const PUBLIC_DIR = path.join(BASE_PATH, 'public')

module.exports = {
	// 登录账号
	USERNAME: process.env.MIZUKI_USERNAME,
	// 登录密码
	PASSWORD: process.env.MIZUKI_PASSWORD,
	// jwt私钥
	JWT_SECRET: process.env.JWT_SECRET,
	// token有效期
	JWT_EXPIRES_IN: '24h',
	BASE_PATH,
	PUBLIC_DIR,
	// 项目部署路径
	DEPLOY_DIR: path.resolve(process.env.DEPLOY_DIR),
	// 运行端口
	PORT: process.env.PORT,
	// .md文章目录
	POSTS_DIR: (() => path.join(BASE_PATH, 'src/content/posts'))(),
	// about.md目录
	ABOUT_DIR: (() => path.join(BASE_PATH, 'src/content/spec'))(),
	// config目录
	CONFIG_DIR: (() => path.join(BASE_PATH, 'src'))(),
	// 相册图片目录
	ALBUMS_DIR: (() => path.join(PUBLIC_DIR, 'images/albums'))(),
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
	// 音乐封面图片目录
	MUSIC_COVER_DIR: (() => path.join(PUBLIC_DIR, 'assets/music/cover'))(),
	// 音乐文件目录
	MUSIC_URL_DIR: (() => path.join(PUBLIC_DIR, 'assets/music/url'))(),
	// 音乐配置目录
	MUSIC_DATA_DIR: (() => path.join(BASE_PATH, 'src/components/widgets/music-player'))(),
	// dist打包目录
	DIST_DIR: (() => path.join(BASE_PATH, 'dist'))(),
	// 相册文件格式
	IMAGE_FORMATS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff', '.tif'],
	// 音乐文件格式
	MUSIC_FORMATS: ['.mp3'],
	// Markdown文档格式
	MARKDOWN_FORMATS: ['.md'],
	// 包管理工具 可选: pnpm | npm | yarn
	PACKAGE_TOOL: 'pnpm',
	// 单个文件限制20MB
	MAX_FILE_SIZE: 20 * 1024 * 1024
}
