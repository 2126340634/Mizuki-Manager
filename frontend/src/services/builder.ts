import { createSSE } from '../utils/sse'
import request from '../utils/request'

interface SSECallback {
	onMessage: (data: any) => void
	onDone?: (data: any) => void
	onError?: (data: any) => void
}

export const deployProjectSSE = (cb: SSECallback) => {
	const { onMessage, onDone, onError } = cb
	const ctrl = createSSE({
		url: '/mizuki/builder/deploy',
		onMessage,
		onDone,
		onError
	})
	return ctrl
}

export const stopDeployProcess = () => request.post({ url: '/mizuki/builder/stop' })
