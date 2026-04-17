const fs = require('fs')
const config = require('../config')
const recast = require('recast')
const parser = require('@babel/parser')
const { isObject, writeFile, isImage, readFile, fileExists, isMusic } = require('../utils/Util')
const path = require('path')
const b = recast.types.builders
const defaultAstParseOptions = {
	parser: {
		parse: (source) =>
			parser.parse(source, {
				sourceType: 'module',
				plugins: ['typescript']
			})
	}
}

class BaseManager {
	// 上传文件(支持批量)
	async uploadFiles(directory, files, conditionFunc) {
		try {
			if (!files || (Array.isArray(files) && !files.length)) return { code: 400, success: false, message: '请上传文件' }
			const tasks = files.map(async (file, index) => {
				const filename = file.originalname
				if (!conditionFunc(file, index)) {
					throw { code: 400, success: false, message: `请上传正确的文件格式: ${filename}` }
				}
				if (file.size > config.MAX_FILE_SIZE) {
					throw { code: 400, success: false, message: `文件大小不能超过 ${(config.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB` }
				}
				if (await fileExists(directory, filename)) {
					throw { code: 400, success: false, message: `名为 ${filename} 的文件已存在` }
				}
				await writeFile(directory, filename, file.buffer)
			})
			const result = (await Promise.allSettled(tasks)).map((res, index) => ({ res, filename: files[index].originalname, path: path.join(directory, files[index].originalname) }))
			const errors = result.filter(({ res }) => res.status === 'rejected')
			if (errors.length) {
				const failedPaths = errors.map((err) => err?.res?.reason?.message || err.filename)
				return { code: 500, success: false, message: `上传失败: ${failedPaths.join('、')}`, error: errors }
			}
			return { code: 200, success: true, data: result }
		} catch (err) {
			return { code: err.code || 500, success: false, message: err.message || '上传失败', error: err }
		}
	}
	// 清除旧图片
	async clearOldImages(imagePathsInConfig, directory) {
		return await this._clearOldFiles(imagePathsInConfig, directory, (filename) => isImage(filename))
	}
	// 清除旧音频
	async clearOldMusic(musicPathsInConfig, directory) {
		return await this._clearOldFiles(musicPathsInConfig, directory, (filename) => isMusic(filename))
	}
	// 清理旧文件
	async _clearOldFiles(pathsInConfig, directory, conditionFunc) {
		try {
			// 配置中需要的
			const pathSet = new Set(pathsInConfig)
			// 当前目录下存在的
			const exists = (await fs.promises.readdir(directory)).filter((filename) => conditionFunc(filename)).map((filename) => path.resolve(directory, filename))
			// 需要删除的
			const olds = exists.filter((existPath) => !pathSet.has(existPath))
			const tasks = olds.map(async (oldPath) => {
				await fs.promises.unlink(oldPath)
			})
			const result = await Promise.allSettled(tasks)
			const errors = result.map((res, index) => ({ res, path: olds[index] })).filter(({ res }) => res.status === 'rejected')
			if (errors.length) {
				const failedPaths = errors.map((err) => err.path)
				return { code: 500, success: false, message: `旧图片清理失败: ${failedPaths.join('、')}`, error: err }
			}
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: `旧图片清理失败`, error: err }
		}
	}
	// 解析ast树获取关键字段数据
	async getConfigData(directory, filename, astParseOptions = defaultAstParseOptions) {
		try {
			if (typeof directory !== 'string' || !directory.length) return { code: 400, success: false, message: '请传入directory' }
			if (typeof filename !== 'string' || !filename.length) return { code: 400, success: false, message: '请传入filename' }
			const code = await readFile(directory, filename, 'utf8')
			const ast = recast.parse(code, astParseOptions)
			const ctx = this
			const data = {}
			recast.visit(ast, {
				visitVariableDeclarator(path) {
					const node = path.node
					const varName = node.id.name
					if (node.init) {
						data[varName] = ctx._astToValue(node.init)
					}
					return false
				}
			})
			return { code: 200, success: true, data }
		} catch (err) {
			return { code: 500, success: false, message: '获取配置文件失败', error: err }
		}
	}
	// data转换为config
	async dataToConfig(directory, filename, data, astParseOptions = defaultAstParseOptions, options = { beforeWrite: () => {}, writed: () => {} }) {
		try {
			if (typeof directory !== 'string' || !directory.length) return { code: 400, success: false, message: '请传入directory' }
			if (typeof filename !== 'string' || !filename.length) return { code: 400, success: false, message: '请传入filename' }
			if (!isObject(data) || !Object.keys(data).length) return { code: 400, success: false, message: '请传入data' }
			const code = await readFile(directory, filename, 'utf8')
			const ast = recast.parse(code, astParseOptions)
			const ctx = this
			recast.visit(ast, {
				visitVariableDeclarator(path) {
					const varName = path.node.id.name
					if (data.hasOwnProperty(varName)) {
						path.get('init').replace(ctx._valueToAst(data[varName]))
					}
					return false
				}
			})
			const output = recast.print(ast).code
			const buffer = Buffer.from(output, 'utf8')
			await Promise.resolve(options.beforeWrite())
			await writeFile(directory, filename, buffer)
			await Promise.resolve(options.writed())
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '配置更新失败', error: err }
		}
	}
	// 递归解析ast树
	_astToValue(node) {
		if (!node) return undefined
		const type = node.type
		const ctx = this
		if (type === 'StringLiteral' || type === 'NumericLiteral' || type === 'BooleanLiteral') {
			return node.value
		}
		if (type === 'ObjectExpression') {
			const obj = {}
			node.properties.forEach((prop) => {
				if (prop.type === 'ObjectProperty') {
					obj[prop.key.name] = ctx._astToValue(prop.value)
				}
			})
			return obj
		}
		if (type === 'ArrayExpression') {
			return node.elements.map((el) => this._astToValue(el))
		}
		return undefined
	}
	// config数据转回变量
	_valueToAst(val) {
		if (val === null) return b.nullLiteral()
		const type = typeof val
		if (type === 'string') return b.stringLiteral(val)
		if (type === 'number') return b.numericLiteral(val)
		if (type === 'boolean') return b.booleanLiteral(val)
		if (Array.isArray(val)) return b.arrayExpression(val.map((item) => this._valueToAst(item)))
		if (type === 'object') {
			const props = Object.entries(val).map(([key, value]) => {
				return b.objectProperty(b.identifier(key), this._valueToAst(value))
			})
			return b.objectExpression(props)
		}
		return b.identifier('undefined')
	}
}

module.exports = BaseManager
