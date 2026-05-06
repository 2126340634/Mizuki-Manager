const path = require('path')
const fs = require('fs')

const envPath = path.resolve(__dirname, '.env')
if (!fs.existsSync(envPath)) {
	console.error('\n.env 文件不存在！请根据根目录下的 .env.example 创建 .env 文件并配置相应的环境变量。\n')
	process.exit(1)
}
require('dotenv').config({ path: envPath })

const { spawn, spawnSync, exec } = require('child_process')
const pm2 = require('pm2')

const isProd = process.argv.includes('--prod')
const PACKAGE_TOOL = process.env.PACKAGE_TOOL

const getPackageCmd = command => {
	if (PACKAGE_TOOL === 'pnpm') return ['pnpm', [command]]
	if (PACKAGE_TOOL === 'npm') return ['npm', ['run', command]]
	if (PACKAGE_TOOL === 'yarn') return ['yarn', [command]]
	console.warn('未知的包管理器:', PACKAGE_TOOL)
	return ['pnpm', [command]]
}

// 安装更新前端依赖
const [installCmd, installArgs] = getPackageCmd('install')
const installRes = spawnSync(installCmd, installArgs, {
	stdio: 'inherit',
	shell: true,
	cwd: './frontend'
})
if (installRes.status !== 0) {
	console.error('\n前端依赖安装更新失败！\n')
	process.exit(1)
}

if (!isProd) {
	// 开发环境下启动前端
	const [devCmd, devArgs] = getPackageCmd('start')
	const frontend = spawn(devCmd, devArgs, {
		stdio: 'inherit',
		shell: true,
		cwd: './frontend',
		env: {
			...process.env,
			NODE_ENV: 'development'
		}
	})
	// 启动后端
	const server = spawn('nodemon', ['--watch', './server', './server/app.js'], {
		stdio: 'inherit',
		shell: true,
		env: {
			...process.env,
			NODE_ENV: 'development'
		}
	})
	const killAll = () => {
		if (process.platform === 'win32') {
			if (server?.pid) exec(`taskkill /F /T /PID ${server.pid}`)
			if (frontend?.pid) exec(`taskkill /F /T /PID ${frontend.pid}`)
		} else {
			server?.kill()
			frontend?.kill()
		}
		setTimeout(() => process.exit(0), 500)
	}
	process.on('SIGINT', killAll)
	process.on('SIGTERM', killAll)
} else {
	// 生产环境依赖构建文件
	const [prodCmd, prodArgs] = getPackageCmd('build')
	const buildRes = spawnSync(prodCmd, prodArgs, {
		stdio: 'inherit',
		shell: true,
		cwd: './frontend',
		env: {
			...process.env,
			NODE_ENV: 'production'
		}
	})
	if (buildRes.status !== 0) {
		console.error('\n前端构建失败！已停止启动服务。\n')
		process.exit(1)
	}
	// 启动pm2进程托管后端
	pm2.connect(err => {
		if (err) {
			console.error('pm2连接失败:', err)
			process.exit(1)
		}
		if (!fs.existsSync('./logs')) fs.mkdirSync('./logs')
		pm2.start(
			{
				script: './server/app.js',
				name: 'mizuki-manager',
				env: {
					...process.env,
					NODE_ENV: 'production'
				},
				output: './logs/out.log',
				error: './logs/error.log',
				merge_logs: true
			},
			(err, proc) => {
				if (err) console.error('pm2进程启动失败:', err)
				else {
					console.log('\npm2进程启动成功！\n')
					spawnSync('pm2', ['list'], {
						stdio: 'inherit',
						shell: true
					})
				}
				pm2.disconnect()
				process.exit(0)
			}
		)
	})
}
