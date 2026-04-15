import { message } from 'antd'
type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE'
interface RequestParams {
	url: string
	method?: MethodType
	data?: any
	headers?: Record<string, string>
}

const request = async (params: RequestParams) => {
	let { url, method = 'GET', data, headers = {} } = params
	const token = localStorage.getItem('token')
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	const isGet = method === 'GET'
	const body = isGet ? undefined : JSON.stringify(data)
	if (isGet) {
		const queryParams = new URLSearchParams(data).toString()
		url = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`
	}
	try {
		const res = await fetch(url, { method, body, headers: { 'Content-Type': 'application/json', ...headers } })
		return await _handleResponse(res)
	} catch (err: any) {
		_handleError(err)
	}
}

request.upload = async (params: { url: string; file: File | Blob | FormData }) => {
	let { url, file } = params
	const token = localStorage.getItem('token')
	const headers: Record<string, string> = {}
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	let formData
	if (file instanceof FormData) {
		formData = file
	} else {
		formData = new FormData()
		formData.append('file', file)
	}
	try {
		const res = await fetch(url, {
			method: 'POST',
			body: formData,
			headers
		})
		return await _handleResponse(res)
	} catch (err: any) {
		_handleError(err)
	}
}

// 处理成功响应
async function _handleResponse(res: Response) {
	const resJson = await res.json()
	if (resJson.code === 401) {
		console.log('跳转登录页')
		throw resJson
	}
	if (!res.ok) throw resJson
	return resJson
}

// 处理失败响应
function _handleError(err: any) {
	console.error(err)
	message.error(err.message || '请求失败')
}

request.get = (params: RequestParams) => request({ ...params, method: 'GET' })
request.post = (params: RequestParams) => request({ ...params, method: 'POST' })
request.put = (params: RequestParams) => request({ ...params, method: 'PUT' })
request.delete = (params: RequestParams) => request({ ...params, method: 'DELETE' })

export default request
