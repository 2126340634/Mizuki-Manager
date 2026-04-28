// 防抖
export const debounce = <T extends (...arg: any[]) => any>(func: T, delay: number, options?: { immediate?: boolean }) => {
	let timer: ReturnType<typeof setTimeout> | null = null
	const debounced = function (this: any, ...args: any[]) {
		if (timer !== null) clearTimeout(timer)
		const { immediate = false } = options || {}
		if (immediate) {
			// 立即执行
			if (timer === null) func.apply(this, args)
			timer = setTimeout(() => {
				timer = null
			}, delay)
		} else {
			timer = setTimeout(() => {
				func.apply(this, args)
				timer = null
			}, delay)
		}
	}
	debounced.cancel = () => {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
	}
	return debounced
}

// 节流
export const throttle = <T extends (...args: any[]) => void>(func: T, delay: number, options?: { immediate?: boolean }) => {
	let timer: ReturnType<typeof setTimeout> | null = null
	const throttled = function (this: any, ...args: any[]) {
		if (timer !== null) return
		const { immediate = false } = options || {}
		if (immediate) {
			func.apply(this, args)
			timer = setTimeout(() => {
				timer = null
			}, delay)
		} else {
			timer = setTimeout(() => {
				func.apply(this, args)
				timer = null
			}, delay)
		}
	}
	throttled.cancel = () => {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
	}
	return throttled
}

// 传入public下的路径拼接
export const getPublicPath = (targetPath: string): string => {
	if (!targetPath) return ''
	const isWebImage = targetPath.startsWith('http://') || targetPath.startsWith('https://') || targetPath.startsWith('//')
	const isBase64 = targetPath.startsWith('data:image/')
	if (isWebImage || isBase64) return targetPath
	return `/public${targetPath.startsWith('/') ? '' : '/'}${targetPath}`
}

// YYYY-MM 比较年月时间戳
export const compareMonth = (str1: string, str2: string): -1 | 0 | 1 | undefined => {
	if (!str1 || !str2) return
	const date1 = new Date(str1 + '-01')
	const date2 = new Date(str2 + '-01')
	const timestamp1 = date1.getTime()
	const timestamp2 = date2.getTime()
	return timestamp1 > timestamp2 ? 1 : timestamp1 < timestamp2 ? -1 : 0
}

// 处理重定向到登录页
export const redirectToLogin = () => {
	localStorage.removeItem('token')
	sessionStorage.removeItem('token')
	window.location.replace('/login')
}

// 深合并 source => target
export const deepMerge = (target: any, source: any): any => {
	if (!target || typeof target !== 'object' || !source) return target
	if (Array.isArray(source)) {
		return source.map((item, i) => deepMerge(Array.isArray(target) ? target[i] : {}, item))
	}
	const result = { ...target }
	for (const key of Object.keys(source)) {
		const s = source[key]
		const t = target[key]
		if (s && typeof s === 'object' && !Array.isArray(s) && t && typeof t === 'object' && !Array.isArray(t)) {
			result[key] = deepMerge(t, s)
		} else {
			result[key] = s
		}
	}
	return result
}

// 递归解包对象中的目标key键值对
export const unwrap = (data: any, key: string): any => {
	// 数组
	if (Array.isArray(data)) {
		return data.map((item) => unwrap(item, key))
	}
	// 对象
	if (data && typeof data === 'object') {
		// 解包key键值对
		if (key in data) {
			return unwrap(data[key], key)
		}
		const result: Record<string, any> = {}
		for (const prop in data) {
			result[prop] = unwrap(data[prop], key)
		}
		return result
	}
	return data
}

// 递归恢复解包对象 source:{ a, b } => target:{ key: {a, b}, xxx... }
export const wrap = (target: any, source: any, key: string): any => {
	if (!target || typeof target !== 'object' || !source) return target
	// 处理数组
	if (Array.isArray(source)) {
		return source.map((item, i) => wrap(Array.isArray(target) ? target[i] : {}, item, key))
	}
	// 解包当前层target的key键值对
	if (key in target) {
		return {
			...target,
			[key]: typeof source === 'object' ? wrap(target[key], source, key) : source
		}
	}
	const result = { ...target }
	for (const prop in source) {
		const targetValue = result.hasOwnProperty(prop) ? result[prop] : { [key]: source[prop] }
		result[prop] = wrap(targetValue, source[prop], key)
	}
	return result
}
