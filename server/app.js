const express = require('express')
const app = express()
const routes = require('./routes/index.js')
const config = require('./config')
const { verifyToken } = require('./middlewares/auth.js')
const path = require('path')

const isProd = process.env.NODE_ENV === 'production'

app.use(express.json()) // 解析json
app.use(express.urlencoded({ extended: true })) // 解析url参数

const SAFE_PATH = path.resolve(config.BASE_PATH)
app.use('/mizuki', (req, res, next) => {
	const queryPath = req.path
	if (!queryPath) return next()

	const realPath = path.resolve(SAFE_PATH, queryPath.substring(1))
	// console.log('queryPath为:', queryPath)
	// console.log('访问完整路径:', realPath)
	// console.log('项目安全根路径:', SAFE_PATH)

	// 防止越出项目根目录访问
	if (!realPath.startsWith(SAFE_PATH)) {
		return res.status(403).json({ code: 403, success: false, message: '非法路径访问' })
	}
	next()
})
const mizukiRouter = express.Router()
// 登录模块
mizukiRouter.use('/auth', routes.auth)

// 令牌验证
mizukiRouter.use(verifyToken)
mizukiRouter.use('/about', routes.about)
mizukiRouter.use('/album', routes.album)
mizukiRouter.use('/anime', routes.anime)
mizukiRouter.use('/config', routes.config)
mizukiRouter.use('/device', routes.device)
mizukiRouter.use('/diary', routes.diary)
mizukiRouter.use('/friend', routes.friend)
mizukiRouter.use('/post', routes.post)
mizukiRouter.use('/project', routes.project)
mizukiRouter.use('/skill', routes.skill)
mizukiRouter.use('/timeline', routes.timeline)
mizukiRouter.use('/music', routes.music)
mizukiRouter.use('/builder', routes.builder)

// 404
mizukiRouter.use((req, res) => {
	res.status(404).json({ code: 404, success: false, message: '无效的资源路径', error: 'Route not found' })
})

app.use('/mizuki', mizukiRouter)

// 提供静态文件访问路径
app.use('/', express.static(path.resolve(config.PUBLIC_DIR)))
app.use('/assets', express.static(path.resolve(config.BASE_PATH, 'src/assets')))

// 生产环境下使用构建文件
if (isProd) {
	const distDir = path.resolve(__dirname, '../frontend/dist')
	app.use(express.static(distDir))
	app.use((req, res) => {
		res.sendFile(path.resolve(distDir, 'index.html'), (err) => {
			if (err) console.error(err)
		})
	})
}

app.use((err, req, res, next) => {
	if (err) console.error(err)
	res.status(500).json({ code: 500, success: false, message: '服务器内部错误', error: 'Internal Server Error' })
})

app.listen(config.PORT, () => {
	console.log(`
    ┌──────────────────────────────────────────────────┐
    │                                                  │
    │   Mizuki Manager Server • Online                 │
    │   Mizuki 后台服务器   • \t在线                   │
    │                                                  │
    │   > 端口: ${config.PORT.toString().padEnd(38)} │
    │   > 环境: ${(process.env.NODE_ENV || 'development').padEnd(38)} │
    │   > 系统: ${process.platform.padEnd(38)} │
    │                                                  │
    │   ${`O(∩_∩)O ~ 运行中...`.padEnd(31)}             │
    │                                                  │
    └──────────────────────────────────────────────────┘
    `)
	isProd && console.log(`注意: 生产环境下使用后台端口${config.PORT}访问应用`)
})
