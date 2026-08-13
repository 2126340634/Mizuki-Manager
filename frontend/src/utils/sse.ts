import { fetchEventSource } from '@microsoft/fetch-event-source'
import { message } from 'antd'
import { redirectToLogin } from './util'
import { refreshToken } from './request'
import { RefObject } from 'react'
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
	controllerRef?: RefObject<AbortController> // 外部传入的AbortController引用,用于外部中断请求
}
interface Data {
	code: number
	success?: boolean
	message: string
}

export const createSSE = (params: SSEParams, retryCount: number = 0) => {
	const { url, method = 'POST', headers = {}, body, openWhenHidden = true, onMessage, onDone = () => {}, onError = () => {}, controllerRef } = params
	const token = localStorage.getItem('token') || sessionStorage.getItem('token')
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	const ctrl = new AbortController()
	if (controllerRef) {
		controllerRef.current = ctrl
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
				// 最多刷新重试3次
				if (retryCount >= 3) {
					message.error('登录刷新失败，请稍后重试')
					redirectToLogin() // 已经重试过了，仍然401，直接跳转登录页
					controllerRef?.current.abort()
					return
				}
				const success = await refreshToken() // 刷新token
				if (success) {
					controllerRef?.current.abort()
					createSSE(params, retryCount + 1) // 刷新成功，重新发起请求
				}
				return
			}
			// 响应失败或格式为json
			if (!res.ok || contentType?.includes('application/json')) {
				const errData = await res.json()
				onError(errData)
				controllerRef?.current.abort()
				return
			}
		},
		// 接收后端的发送一个带success字段的响应对象判断是否传输完成
		onmessage(msg) {
			const data: Data = JSON.parse(msg.data)
			if (data.success === true) {
				onDone(data)
				controllerRef?.current.abort()
				return
			}
			if (data.success === false) {
				onError(data)
				controllerRef?.current.abort()
				return
			}
			onMessage(data)
		},
		onerror(err) {
			console.error(err)
			message.error(err.message || '连接异常')
		}
	})
}
