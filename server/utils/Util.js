const fs = require('fs')
const path = require('path')
const config = require('../config.js')

// 文件是否存在
async function fileExists(directory, filename) {
	try {
		const filePath = path.resolve(directory, filename)
		await fs.promises.access(filePath)
		return true
	} catch {
		return false
	}
}
// 确保目录存在
async function ensureDirExist(directory, { create = true } = {}) {
	try {
		await fs.promises.access(directory)
		return true
	} catch {
		if (create)
			await fs.promises.mkdir(directory, {
				recursive: true
			})
		return false
	}
}
// 读取文件
async function readFile(directory, filename, encoding) {
	const filePath = path.resolve(directory, filename)
	return await fs.promises.readFile(filePath, encoding)
}
// 删除文件
async function deleteFile(directory, filename) {
	const filePath = path.resolve(directory, filename)
	await fs.promises.unlink(filePath)
}
// 写入文件
async function writeFile(directory, filename, content, encoding = 'utf8') {
	await ensureDirExist(directory)
	const filePath = path.resolve(directory, filename)
	if (Buffer.isBuffer(content)) await fs.promises.writeFile(filePath, content)
	else await fs.promises.writeFile(filePath, content, encoding)
}
// 判断为对象
function isObject(val) {
	return typeof val === 'object' && val !== null
}
// 判断为图片
function isImage(filename) {
	if (typeof filename !== 'string' || !filename) return false
	return config.IMAGE_FORMATS.some(format => filename.endsWith(format))
}
// 判断为音乐
function isMusic(filename) {
	if (typeof filename !== 'string' || !filename) return false
	return config.MUSIC_FORMATS.some(format => filename.endsWith(format))
}
// 判断为Markdown文档
function isMarkdown(filename) {
	if (typeof filename !== 'string' || !filename) return false
	return config.MARKDOWN_FORMATS.some(format => filename.endsWith(format))
}
// 文件命名校验
function isLegalFilename(filename) {
	if (typeof filename !== 'string') return false
	return /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]{1,100}$/.test(filename)
}

module.exports = {
	fileExists,
	ensureDirExist,
	readFile,
	deleteFile,
	writeFile,
	isObject,
	isImage,
	isMusic,
	isMarkdown,
	isLegalFilename
}
