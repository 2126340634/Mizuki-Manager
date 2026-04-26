import { fetchEventSource } from '@microsoft/fetch-event-source'
import { message } from 'antd'
import { redirectToLogin } from './util'
type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE'
interface SSEParams {
	url: string
	method?: MethodType
	headers?: Record<string, string>
	body?: any
	openWhenHidden?: boolean // 为false时,其他标签页或最小化切回浏览器时会重新发起请求
	onMessage: (data: any) => void
	onDone?: (data: any) => void
	onError?: (data: any) => void
}
interface Data {
	code: number
	success?: boolean
	message: string
}

export const createSSE = (params: SSEParams) => {
	const { url, method = 'POST', headers = {}, body, openWhenHidden = true, onMessage, onDone = () => {}, onError = () => {} } = params
	const ctrl = new AbortController()
	const token = localStorage.getItem('token') || sessionStorage.getItem('token')
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	fetchEventSource(url, {
		method,
		body: body && JSON.stringify(body),
		headers: { 'Content-Type': 'application/json', ...headers },
		signal: ctrl.signal,
		openWhenHidden,
		async onopen(res) {
			const contentType = res.headers.get('Content-Type')
			// 401返回json结果
			if (res.status === 401) {
				const errData = await res.json()
				redirectToLogin()
				message.error(errData.message || '请先登录')
				ctrl.abort()
				return
			}
			// 响应失败或格式为json
			if (!res.ok || contentType?.includes('application/json')) {
				const errData = await res.json()
				onError(errData)
				ctrl.abort()
				return
			}
		},
		// 接收后端的发送一个带success字段的响应对象判断是否传输完成
		onmessage(msg) {
			const data: Data = JSON.parse(msg.data)
			if (data.success === true) {
				onDone(data)
				ctrl.abort()
				return
			}
			if (data.success === false) {
				onError(data)
				ctrl.abort()
				return
			}
			onMessage(data)
		},
		onerror(err) {
			console.error(err)
			message.error(err.message || '连接异常')
		}
	})
	return ctrl
}
