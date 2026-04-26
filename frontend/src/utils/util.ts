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
