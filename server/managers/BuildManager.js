const fs = require('fs')
const { spawn } = require('child_process')
const config = require('../config.js')
const path = require('path')

class BuildManager {
	constructor() {
		this.basePath = config.BASE_PATH
		this.deployDir = config.DEPLOY_DIR
		this.distDir = config.DIST_DIR
		this.buildCommand = { pnpm: 'pnpm build', npm: 'npm run build', yarn: 'yarn build' }[config.PACKAGE_TOOL] || 'pnpm build'
	}
	/**
	 * @description 重新构建部署dist
	 * @return {Promise<{code: number, success: boolean, message?: string, error?: any}>}
	 */
	async deploy() {
		return new Promise((resolve) => {
			const process = spawn(this.buildCommand, {
				cwd: this.basePath,
				shell: true,
				stdio: 'ignore'
			})
			process.on('close', async (code) => {
				if (code !== 0) {
					resolve({ code: 500, success: false, message: `部署失败: code${code}` })
					return
				}
				if (path.resolve(this.distDir) !== path.resolve(this.deployDir)) {
					await fs.promises.rm(this.deployDir, { recursive: true, force: true })
					await fs.promises.cp(this.distDir, this.deployDir, { recursive: true, force: true })
				}
				resolve({ code: 200, success: true })
			})
			process.on('error', (err) => {
				resolve({ code: 500, success: false, message: '无法启动构建进程', error: err })
			})
		})
	}
}

module.exports = BuildManager
