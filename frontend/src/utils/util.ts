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
export const throttle = <T extends (...args: any[]) => void>(func: T, delay: number, options: { immediate?: boolean }) => {
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
