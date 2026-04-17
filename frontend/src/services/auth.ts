import request from '../utils/request'

// 登录
export const login = (data: { username: string; password: string }) => request.post({ url: '/mizuki/auth/login', data })
