const express = require('express')
const app = express()
const routes = require('./routes/index.js')
const config = require('./config')

app.use(express.json()) // 解析json
app.use(express.urlencoded({ extended: true })) // 解析url参数

app.use('/about', routes.about)
app.use('/album', routes.album)
app.use('/anime', routes.anime)
app.use('/config', routes.config)
app.use('/device', routes.device)
app.use('/diary', routes.diary)
app.use('/friend', routes.friend)
app.use('/post', routes.post)
app.use('/project', routes.project)
app.use('/skill', routes.skill)
app.use('/timeline', routes.timeline)
app.use('/builder', routes.builder)

// 404
app.use('/{*file}', (req, res) => {
	res.status(404).json({ success: false, message: '无效的资源路径', error: 'Route not found' })
})

app.use((err, req, res, next) => {
	console.error(err)
	res.status(500).json({ success: false, message: '服务器内部错误', error: 'Internal Server Error' })
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
