const fs = require('fs')
const { spawn, exec } = require('child_process')
const config = require('../config.js')
const path = require('path')

class BuildManager {
	constructor() {
		this.basePath = config.BASE_PATH
		this.deployDir = config.DEPLOY_DIR
		this.distDir = config.DIST_DIR
		this.buildCommand = { pnpm: 'pnpm build', npm: 'npm run build', yarn: 'yarn build' }[config.PACKAGE_TOOL] || 'pnpm build'
		this.childProcess = null
		this.isWindows = process.platform === 'win32'
	}

	// 部署构建
	async deploy(onLog) {
		return new Promise((resolve, reject) => {
			if (this.childProcess) {
				reject({ code: 409, success: false, message: '已有正在运行的构建任务' })
				return
			}
			if (onLog) onLog('[System] 准备启动构建任务...\n')

			if (this.isWindows) {
				// Windows
				this.childProcess = spawn('cmd.exe', ['/c', this.buildCommand], {
					cwd: this.basePath,
					stdio: 'pipe',
					windowsHide: true
				})
			} else {
				// Linux/Mac
				const [cmd, ...args] = this.buildCommand.split(' ')
				this.childProcess = spawn(cmd, args, {
					cwd: this.basePath,
					stdio: 'pipe',
					detached: true
				})
			}
			// 监听输出
			this.childProcess.stdout.on('data', (data) => {
				console.log(data.toString())
				if (onLog) onLog(data.toString())
			})
			// 监听错误
			this.childProcess.stderr.on('data', (data) => {
				console.error(data.toString())
				if (onLog) onLog(`[Error] ${data.toString()}`)
			})
			this.childProcess.on('close', async (code) => {
				this.childProcess = null
				if (code !== 0) {
					reject({ code: 500, success: false, message: `构建失败: code${code}` })
					return
				}
				if (path.resolve(this.distDir) !== path.resolve(this.deployDir)) {
					if (onLog) onLog('[System] 构建完成，正在迁移文件到部署目录...\n')
					await fs.promises.rm(this.deployDir, { recursive: true, force: true })
					await fs.promises.cp(this.distDir, this.deployDir, { recursive: true, force: true })
				}
				if (onLog) onLog('\n[System] 部署完成\n')
				resolve({ code: 200, success: true })
			})
			this.childProcess.on('error', (err) => {
				this.childProcess = null
				reject({ code: 500, success: false, message: `[System] 构建进程启动失败: ${err}` })
			})
		})
	}

	// 强制停止构建子进程
	stopProcess() {
		try {
			if (this.childProcess && this.childProcess.pid) {
				const pid = this.childProcess.pid
				if (this.isWindows) {
					// Windows
					exec(`taskkill /PID ${pid} /T /F`, (err) => {
						if (err) console.error('终止进程失败:', err)
					})
				} else {
					// Linux/Mac
					process.kill(-pid, 'SIGKILL')
				}
				this.childProcess.removeAllListeners()
				this.childProcess = null
				return { code: 200, success: true, message: '已停止部署进程' }
			}
			return { code: 404, success: false, message: '无运行中的任务' }
		} catch (err) {
			return { code: 500, success: false, message: '执行失败', error: err }
		}
	}
}

module.exports = BuildManager
