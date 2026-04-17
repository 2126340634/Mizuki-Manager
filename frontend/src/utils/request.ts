import { message } from 'antd'
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

const request = async (params: RequestParams) => {
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
		return await _handleResponse(res)
	} catch (err: any) {
		_handleError(err)
		throw err
	}
}

request.upload = async (params: UploadParams) => {
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
		return await _handleResponse(res)
	} catch (err: any) {
		_handleError(err)
		throw err
	}
}

// 成功响应
async function _handleResponse(res: Response) {
	const resJson = await res.json()
	if (resJson.code === 401) {
		localStorage.removeItem('token')
		sessionStorage.removeItem('token')
		window.location.replace('/login')
		throw resJson
	}
	if (!res.ok || resJson.code !== 200) throw resJson
	return resJson
}

// 失败响应
function _handleError(err: any) {
	console.error(err)
	message.error(err.message || '请求失败')
}

request.get = (params: RequestParams) => request({ ...params, method: 'GET' })
request.post = (params: RequestParams) => request({ ...params, method: 'POST' })
request.put = (params: RequestParams) => request({ ...params, method: 'PUT' })
request.delete = (params: RequestParams) => request({ ...params, method: 'DELETE' })

export default request
