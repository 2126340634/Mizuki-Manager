import { useEffect, useRef } from 'react'

export const usePolling = <T extends (...args: any[]) => void>(func: T, delay: number, options: { immediate?: boolean } = {}) => {
	const timer = useRef<NodeJS.Timeout | null>(null)
	const funcRef = useRef(func)
	const { immediate = false } = options

	const start = () => {
		stop()
		if (immediate) funcRef.current()
		timer.current = setInterval(funcRef.current, delay)
	}

	const stop = () => {
		if (timer.current !== null) {
			clearInterval(timer.current)
			timer.current = null
		}
	}

	useEffect(() => {
		return () => {
			stop()
		}
	}, [])

	useEffect(() => {
		funcRef.current = func
	}, [func])

	return { start, stop }
}
