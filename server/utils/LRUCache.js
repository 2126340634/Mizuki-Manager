class LRUCache extends Map {
	constructor(maxSize) {
		super()
		this.maxSize = maxSize
	}
	set(key, value) {
		// 置顶当前访问的键值
		if (this.has(key)) super.delete(key)
		super.set(key, value)
		// 超出容量删除最旧的一个元素
		if (this.size > this.maxSize) {
			const firstKey = this.keys().next().value // 迭代第一个为最旧的元素
			this.delete(firstKey)
		}
		return this
	}
}

module.exports = LRUCache
