import { createSSE } from '../utils/sse'
import request from '../utils/request'
import { RefObject } from 'react'

interface SSECallback {
	onMessage: (data: any) => void
	onDone?: (data: any) => void
	onError?: (data: any) => void
}

export const deployProjectSSE = (cb: SSECallback, controllerRef: RefObject<AbortController>) => {
	const { onMessage, onDone, onError } = cb
	const ctrl = createSSE({
		url: '/mizuki/builder/deploy',
		onMessage,
		onDone,
		onError,
		controllerRef
	})
	return ctrl
}

export const syncDeployStatus = (cb: SSECallback, controllerRef: RefObject<AbortController>) => {
	const { onMessage, onDone, onError } = cb
	const ctrl = createSSE({
		url: '/mizuki/builder',
		method: 'GET',
		onMessage,
		onDone,
		onError,
		controllerRef
	})
	return ctrl
}

export const stopDeployProcess = () => request.post({ url: '/mizuki/builder/stop' })
