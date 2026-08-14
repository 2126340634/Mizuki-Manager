import { message } from 'antd'
import { redirectToLogin } from './util'

type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE'
interface RequestParams {
	url: string
	method?: MethodType
	data?: Record<string, any>
	headers?: Record<string, string>
}
interface UploadParams {
	url: string
	file?: File | Blob | FormData
	files?: (File | Blob | FormData)[]
	data?: Record<string, any>
}

// 公共刷新短token方法
export const refreshToken = async () => {
	try {
		const res = await fetch('/mizuki/auth/refresh-token', {
			method: 'POST',
			credentials: 'include' // 长token在cookie中，自动携带
		})
		const resJson = await res.json()
		if (!res.ok || resJson.code !== 200) throw resJson
		const newToken = resJson.data.token
		localStorage.setItem('token', newToken)
		sessionStorage.setItem('token', newToken)
		return true // 刷新成功
	} catch (err: any) {
		if (err.code === 401) {
			await redirectToLogin() // 长token过期，重新登录
			return
		}
		_handleError(err)
		return false // 刷新失败
	}
}

const request = async (params: RequestParams, retried?: boolean): Promise<any> => {
	let { url, method = 'GET', data, headers = {} } = params
	const token = localStorage.getItem('token') || sessionStorage.getItem('token')
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	const isGet = method === 'GET'
	const body = isGet ? undefined : JSON.stringify(data)
	if (isGet) {
		const queryParams = new URLSearchParams(data).toString()
		if (queryParams) url = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`
	}
	try {
		const res = await fetch(url, { method, body, headers: { 'Content-Type': 'application/json', ...headers } })
		return await _handleResponse(res, request, params, retried)
	} catch (err: any) {
		_handleError(err)
		throw err
	}
}

request.upload = async (params: UploadParams, retried?: boolean) => {
	let { url, file, files, data } = params
	const token = localStorage.getItem('token')
	const headers: Record<string, string> = {}
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	const fd = file instanceof FormData ? file : new FormData()
	if (data) {
		Object.keys(data).forEach((key) => fd.append(key, data[key]))
	}
	if (!(file instanceof FormData) && file) {
		fd.append('file', file)
	}
	files?.forEach((f) => {
		if (f instanceof File || f instanceof Blob) fd.append('files', f)
	})
	try {
		const res = await fetch(url, {
			method: 'POST',
			body: fd,
			headers
		})
		return await _handleResponse(res, request.upload, params, retried)
	} catch (err: any) {
		_handleError(err)
		throw err
	}
}

// 成功响应
async function _handleResponse(
	res: Response,
	retryFunc?: (params: RequestParams | UploadParams, retried?: boolean) => Promise<any>,
	params?: RequestParams | UploadParams,
	retried?: boolean
) {
	const resJson = await res.json()
	if (resJson.code === 401) {
		if (retried) throw resJson // 已经重试过了，仍然401，直接抛出异常
		const success = await refreshToken() // 刷新token
		// 重试请求
		if (success && retryFunc && params) {
			return await retryFunc(params, true)
		} else {
			throw resJson
		}
	}
	if (!res.ok || resJson.code !== 200) throw resJson
	return resJson
}

// 不提示的状态码
const NO_MESSAGE_CODE = [601]

// 失败响应
function _handleError(err: any) {
	if (!NO_MESSAGE_CODE.includes(err.code)) {
		console.error(err)
		message.error(err.message || '请求失败')
	}
}

request.get = (params: RequestParams) => request({ ...params, method: 'GET' })
request.post = (params: RequestParams) => request({ ...params, method: 'POST' })
request.put = (params: RequestParams) => request({ ...params, method: 'PUT' })
request.delete = (params: RequestParams) => request({ ...params, method: 'DELETE' })

export default request
