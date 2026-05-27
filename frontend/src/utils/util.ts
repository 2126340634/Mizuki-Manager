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
		for (const prop of Object.keys(data)) {
			result[prop] = unwrap(data[prop], key)
		}
		return result
	}
	return data
}

// 递归恢复解包对象(同一层属性source覆盖target) source:{ a, b } => target:{ key: {a, b}, xxx... }
export const wrap = (target: any, source: any, key: string): any => {
	// target当前层为空直接source覆盖
	if (!target || typeof target !== 'object') return source
	// 处理数组
	if (Array.isArray(source)) {
		return {
			[key]: source.map((item, i) => {
				if (typeof item !== 'object' || !item) return item // 数组内普通元素直接返回
				return wrap(Array.isArray(target) ? target[i] : {}, item, key) // 数组内对象递归处理
			})
		}
	}
	// 处理当前层target的key键值对
	if (key in target) {
		return { ...target, [key]: wrap(target[key], source, key) }
	}
	const result = { ...target }
	for (const prop of Object.keys(source)) {
		const targetValue = result.hasOwnProperty(prop) ? result[prop] : { [key]: source[prop] }
		result[prop] = wrap(targetValue, source[prop], key)
	}
	return result
}

// 深合并对象 source合并到target, 覆盖target同层级属性
export const deepMerge = (target: any, source: any): any => {
	if (!source || typeof source !== 'object') return source
	if (!target || typeof target !== 'object') return JSON.parse(JSON.stringify(source)) // 防止引用当前source
	// source数组替换掉target
	if (Array.isArray(source)) {
		const result = [...target]
		source.forEach((item, i) => {
			result[i] = deepMerge(target[i], item)
		})
		return result
	}
	// source对象值覆盖target
	const result = { ...target }
	for (const prop of Object.keys(source)) {
		result[prop] = result.hasOwnProperty(prop) ? deepMerge(target[prop], source[prop]) : deepMerge({}, source[prop])
	}
	return result
}

// 格式化时间 YYYY-MM-DD
export const formatTime = (date: Date): string => {
	if (!date) return ''
	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')
	return `${year}-${month}-${day}`
}
