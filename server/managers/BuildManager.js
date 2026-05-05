const fs = require('fs')
const { spawn, exec } = require('child_process')
const config = require('../config.js')
const path = require('path')
const { EventEmitter } = require('events')

/**
 * 注意内部函数执行完后会清理闭包
 * 闭包清理后上一次部署的日志将会清空
 */
class BuildManager extends EventEmitter {
	constructor() {
		super()
		this.basePath = config.BASE_PATH
		this.deployDir = config.DEPLOY_DIR
		this.distDir = config.DIST_DIR
		this.buildCommand =
			{
				pnpm: 'pnpm build',
				npm: 'npm run build',
				yarn: 'yarn build'
			}[config.PACKAGE_TOOL] || 'pnpm build'
		this.installCommand =
			{
				pnpm: 'pnpm install',
				npm: 'npm install',
				yarn: 'yarn install'
			}[config.PACKAGE_TOOL] || 'pnpm install'
		this.childProcess = null
		this.isWindows = process.platform === 'win32'
		this.log = '' // 缓存当前日志
		this.callbacks = new Set() // 多个监听运行输出回调
	}
	_appendLog(data) {
		this.log += data.log || ''
		return data
	}
	// 添加状态重连输出监听
	addCallback(cb) {
		const { sendLog, handleEnd } = cb
		if (!this.childProcess) {
			// 直接通知前端断开SSE
			if (typeof handleEnd === 'function') {
				handleEnd({
					code: 200,
					success: true
				})
			}
			return
		}
		if (typeof sendLog === 'function') {
			const time = new Date().toISOString().replace('T', ' ').substring(0, 19)
			sendLog({
				log: this.log,
				isHistory: true
			}) // 回传历史日志
			sendLog({
				log: `\n---\n已连接部署进程\n${time}\n---\n`
			})
		}
		this.callbacks.add(cb)
	}
	// 移除监听
	removeCallback(cb) {
		this.callbacks.delete(cb)
	}
	clearCallbacks() {
		this.callbacks.clear()
	}
	/**
	 * @description 执行输出回调
	 * @param {string|object} data
	 * @param {'log'|'done'|'error'} mode
	 */
	execCallback(mode, data) {
		if (mode === 'log') {
			this.callbacks.forEach(cb => {
				if (typeof cb.sendLog === 'function') cb.sendLog(data)
			})
		} else if (mode === 'error' || mode === 'done') {
			this.callbacks.forEach(cb => {
				if (typeof cb.handleEnd === 'function') cb.handleEnd(data)
			})
			this.clearCallbacks() // 进程结束清空所有监听
		}
	}
	/**
	 * @description 部署前安装更新包管理器
	 * @func onLog 发送新日志内容回调
	 * @func onError 执行出错回调,发送错误数据对象
	 * @returns {Promise<boolean>} true为安装成功
	 */
	_installPackage(onLog) {
		const installParts = this.installCommand.split(' ')
		const command = this.isWindows ? 'cmd.exe' : installParts[0]
		const args = this.isWindows ? ['/c', this.installCommand] : installParts.slice(1)
		const process = spawn(command, args, {
			cwd: this.basePath
		})

		this.execCallback('log', {
			log: `[System] 开始安装更新包管理器...\n`
		})
		onLog(
			this._appendLog({
				log: `[System] 开始安装更新包管理器...\n`
			})
		)

		process.stdout.on('data', data => {
			const cbData = data.toString()
			this.execCallback('log', {
				log: cbData
			})
			onLog(
				this._appendLog({
					log: cbData
				})
			)
		})
		process.stderr.on('data', data => {
			const cbData = data.toString()
			this.execCallback('log', {
				log: `[Install Error] ${cbData}`
			})
			onLog(
				this._appendLog({
					log: `[Install Error] ${cbData}`
				})
			)
		})
		return new Promise(resolve => {
			process.on('close', code => {
				if (code !== 0) return resolve(false)
				resolve(true)
			})
		})
	}
	/**
	 * @description 部署构建
	 * @func onLog 发送新日志内容回调
	 * @func onDone 部署完成回调,发送成功数据对象
	 * @func onError 执行出错回调,发送错误数据对象
	 */
	async deploy(onLog, onDone, onError) {
		if (this.childProcess) {
			this.execCallback('error', {
				code: 409,
				success: false,
				message: `\n[System] 已有在运行中的任务\n`
			})
			onError({
				code: 409,
				success: false,
				message: `\n[System] 已有在运行中的任务\n`
			})
			return
		}

		this.log = ''
		this.clearCallbacks()

		// 安装更新包管理器
		const installed = await this._installPackage(onLog)
		if (!installed) {
			this.execCallback('error', {
				code: 500,
				success: false,
				message: `\n[System] 安装更新包管理器失败\n`
			})
			onError({
				code: 500,
				success: false,
				message: `\n[System] 安装更新包管理器失败\n`
			})
			this.childProcess = null
			return
		}

		this.execCallback('log', {
			log: '\n[System] 准备启动构建任务...\n'
		})
		onLog(
			this._appendLog({
				log: '\n[System] 准备启动构建任务...\n'
			})
		)

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
		this.childProcess.stdout.on('data', data => {
			const cbData = data.toString()
			console.log(cbData)
			this.execCallback('log', {
				log: cbData
			})
			onLog(
				this._appendLog({
					log: cbData
				})
			)
		})
		// 监听错误
		this.childProcess.stderr.on('data', data => {
			const cbData = data.toString()
			console.error(cbData)
			this.execCallback('log', {
				log: `[Error] ${cbData}`
			}) // 这边不能直接error回调，不然前端直接断连了
			onLog(
				this._appendLog({
					log: `[Error] ${cbData}`
				})
			)
		})
		this.childProcess.on('close', async code => {
			if (code !== 0) {
				const cbData = {
					code: 500,
					success: false,
					message: `\n[System] 构建失败: code${code}\n`
				}
				this.execCallback('error', cbData)
				onError(cbData)
				this.childProcess = null
				return
			}
			if (path.resolve(this.distDir) !== path.resolve(this.deployDir)) {
				onLog(
					this._appendLog({
						log: '\n[System] 构建完成，正在迁移文件到部署目录...\n'
					})
				)
				await fs.promises.rm(this.deployDir, {
					recursive: true,
					force: true
				})
				await fs.promises.cp(this.distDir, this.deployDir, {
					recursive: true,
					force: true
				})
			}
			const endLog = '\n[System] 部署完成\n'
			this.execCallback('log', {
				log: endLog
			})
			onLog(
				this._appendLog({
					log: endLog
				})
			)
			// 结束回调
			this.execCallback('done', {
				code: 200,
				success: true
			})
			onDone({
				code: 200,
				success: true
			})
			// 清除子进程引用
			this.childProcess = null
		})
		this.childProcess.on('error', err => {
			const cbData = {
				code: 500,
				success: false,
				message: `\n[System] 构建进程启动失败: ${err}\n`
			}
			this.execCallback('error', cbData)
			onError(cbData)
			this.childProcess = null
			return
		})
	}
	// 强制停止构建子进程
	stopProcess() {
		try {
			if (this.childProcess && this.childProcess.pid) {
				const pid = this.childProcess.pid
				if (this.isWindows) {
					// Windows
					exec(`taskkill /PID ${pid} /T /F`, err => {
						if (err) console.error('终止进程失败:', err)
					})
				} else {
					// Linux/Mac
					process.kill(-pid, 'SIGKILL')
				}
				this.clearCallbacks()
				this.childProcess.removeAllListeners()
				this.childProcess = null
				return {
					code: 200,
					success: true,
					message: '已停止部署进程'
				}
			}
			return {
				code: 404,
				success: false,
				message: '无运行中的任务'
			}
		} catch (err) {
			return {
				code: 500,
				success: false,
				message: '执行失败',
				error: err
			}
		}
	}
}

module.exports = BuildManager
