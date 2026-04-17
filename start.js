const { spawn, spawnSync } = require('child_process')
const pm2 = require('pm2')
const path = require('path')

const isProd = process.argv.includes('--prod')

if (!isProd) {
	// 开发环境下启动前端
	const frontend = spawn('pnpm', ['start'], { stdio: 'inherit', shell: true, cwd: './frontend' })
	// 启动后端
	const server = spawn('nodemon', ['--watch', './server', './server/app.js'], {
		stdio: 'inherit',
		shell: true,
		env: { ...process.env, NODE_ENV: 'development' }
	})
	// 关闭进程
	const killAll = () => {
		server?.kill()
		frontend?.kill()
		process.exit(0)
	}
	process.on('SIGINT', killAll)
	process.on('SIGTERM', killAll)
} else {
	// 生产环境依赖构建文件
	const buildRes = spawnSync('pnpm', ['build'], { stdio: 'inherit', shell: true, cwd: './frontend' })
	if (buildRes.status !== 0) {
		console.error('前端构建失败, 停止启动服务')
		process.exit(1)
	}
	// 启动pm2进程监控后端
	pm2.connect((err) => {
		if (err) {
			console.error('pm2连接失败:', err)
			process.exit(1)
		}
		pm2.start(
			{
				script: './server/app.js',
				name: 'mizuki-manager',
				env: { ...process.env, NODE_ENV: 'production' },
				output: './logs/out.log',
				error: './logs/error.log',
				merge_logs: true
			},
			(err, proc) => {
				if (err) console.error('pm2进程启动失败:', err)
				else {
					console.log('\n==================== pm2进程启动成功 ====================\n')
					spawnSync('pm2', ['list'], { stdio: 'inherit', shell: true })
				}
				pm2.disconnect()
				process.exit(0)
			}
		)
	})
}
