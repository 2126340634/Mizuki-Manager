const os = require('os')

class SystemManager {
	constructor() {}
	getInfo() {
		return {
			code: 200,
			success: true,
			data: {
				hostname: os.hostname(), // 主机名
				platform: os.platform(), // 平台
				arch: os.arch(), // CPU架构
				cpus: os.cpus(), // CPU核心
				totalMemory: os.totalmem(), // 总内存(字节)
				freeMemory: os.freemem(), // 空闲内存(字节)
				uptime: os.uptime(), // 运行时间(秒)
				networkInterfaces: os.networkInterfaces(), // 网络接口
				loadAvg: os.loadavg(), // 系统负载
				type: os.type(), // 系统类型
				release: os.release(), // 系统版本
				userInfo: os.userInfo() // 当前用户
			}
		}
	}
}

module.exports = SystemManager
