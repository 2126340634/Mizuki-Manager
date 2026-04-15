const express = require('express')
const app = express()
const routes = require('./routes/index.js')
const config = require('./config')
const { verifyToken } = require('./middlewares/auth.js')

app.use(express.json()) // 解析json
app.use(express.urlencoded({ extended: true })) // 解析url参数

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
mizukiRouter.use('/{*file}', (req, res) => {
	res.status(404).json({ code: 404, success: false, message: '无效的资源路径', error: 'Route not found' })
})

app.use('/mizuki', mizukiRouter)

app.use((err, req, res, next) => {
	console.error(err)
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
    │                                                  │
    │   ${`O(∩_∩)O ~ 运行中...`.padEnd(31)}             │
    │                                                  │
    └──────────────────────────────────────────────────┘
    `)
})
