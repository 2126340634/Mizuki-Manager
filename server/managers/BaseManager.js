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
	// 上传文件(支持批量) skipIfExists:true => 文件已存在时不报错
	async uploadFiles(directory, files, conditionFunc, { skipIfExists = false } = {}) {
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
					if (!skipIfExists) {
						throw { code: 409, success: false, message: `名为 ${filename} 的文件已存在` }
					}
				} else {
					await writeFile(directory, filename, file.buffer)
				}
			})
			const result = (await Promise.allSettled(tasks)).map((res, index) => {
				const absolutePath = path.join(directory, files[index].originalname)
				const match = absolutePath.match(/.*?(\\|\/)public(\\|\/)(.*)/) // 匹配public下的路径
				const publicPath = `/${match && match[3] ? match[3].replace(/\\/g, '/') : ''}` // 替换反斜杠
				return { res, filename: files[index].originalname, path: absolutePath, publicPath }
			})
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
	// 获取注释
	_getComment(node) {
		return node.comments ? node.comments.map((c) => c.value.trim()).join('\n') : undefined
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
						data[varName] = { value: ctx._astToValue(node.init), comment: ctx._getComment(node) }
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
		const { beforeWrite = () => {}, writed = () => {} } = options || {}
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
						const item = data[varName]
						const newValue = item && typeof item === 'object' && 'value' in item ? item.value : item
						path.get('init').replace(ctx._valueToAst(newValue))
						if (item && item.comment !== undefined) {
							path.parentPath.node.comments = [b.commentLine(' ' + item.comment)]
						}
					}
					return false
				}
			})
			const output = recast.print(ast, { quote: 'single', trailingComma: false, tabWidth: 2, useTabs: false }).code
			const buffer = Buffer.from(output, 'utf8')
			if (typeof beforeWrite === 'function') await beforeWrite()
			await writeFile(directory, filename, buffer)
			if (typeof writed === 'function') await writed()
			return { code: 200, success: true }
		} catch (err) {
			return { code: 500, success: false, message: '配置更新失败', error: err }
		}
	}
	// 解析成员表达式和标识符
	_getMemberPath(node) {
		if (node.type === 'Identifier') return node.name
		if (node.type === 'MemberExpression') {
			const objPath = this._getMemberPath(node.object)
			const propName = node.property.name
			return `${objPath}.${propName}`
		}
		return ''
	}
	// 递归解析ast树
	_astToValue(node) {
		if (!node) return undefined
		const type = node.type
		const ctx = this
		// 处理负数
		if (type === 'UnaryExpression' && node.operator === '-') {
			// 递归处理表达式中的数值
			const argumentValue = this._astToValue(node.argument)
			if (typeof argumentValue === 'number') return -argumentValue
			return undefined
		}
		// 普通变量
		if (type === 'StringLiteral' || type === 'NumericLiteral' || type === 'BooleanLiteral') {
			return node.value
		}
		// 成员表达式 a.member1, b.member2
		if (type === 'Identifier' || type === 'MemberExpression') {
			return { __isRef: true, __refName: this._getMemberPath(node) }
		}
		// 处理对象
		if (type === 'ObjectExpression') {
			const obj = {}
			node.properties.forEach((prop) => {
				if (prop.type === 'ObjectProperty') {
					const key = prop.key.name || prop.key.value
					obj[key] = { value: ctx._astToValue(prop.value), comment: this._getComment(prop) }
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
		// 递归解包 {value: xxx, comment: xxx}
		if (val && type === 'object' && 'value' in val && !val.__isRef) {
			const node = this._valueToAst(val.value)
			if (val.comment) {
				const isMultiLine = val.comment.includes('\n')
				const commentNode = isMultiLine
					? b.commentBlock(`*\n * ${val.comment.replace(/\n/g, '\n * ')}\n `, true) // 块注释
					: b.commentLine(' ' + val.comment, true)

				node.comments = [commentNode]
			}
		}
		// 回写成员表达式和引用标识符
		if (val && type === 'object' && val.__isRef) {
			const parts = val.__refName.split('.')
			return parts.reduce((sum, cur) => {
				if (!sum) return b.identifier(cur) // 第一个为标识符
				return b.memberExpression(sum, b.identifier(cur))
			}, null)
		}
		// 普通变量
		if (type === 'string') return b.stringLiteral(val)
		if (type === 'number') return b.numericLiteral(val)
		if (type === 'boolean') return b.booleanLiteral(val)
		// 复杂变量
		if (Array.isArray(val)) return b.arrayExpression(val.map((item) => this._valueToAst(item)))
		if (type === 'object') {
			const props = Object.entries(val).map(([key, item]) => {
				const targetValue = item && typeof item === 'object' && 'value' in item ? item.value : item
				const property = b.objectProperty(b.identifier(key), this._valueToAst(targetValue))
				if (item.comment) {
					const isMultiLine = item.comment.includes('\n')
					const commentNode = isMultiLine
						? b.commentBlock(`*\n * ${item.comment.replace(/\n/g, '\n * ')}\n `, true) // 块注释
						: b.commentLine(' ' + item.comment, true) // true 表示 leading 注释

					property.comments = [commentNode]
				}
				return property
			})
			return b.objectExpression(props)
		}
		return b.identifier('undefined')
	}
}

module.exports = BaseManager
