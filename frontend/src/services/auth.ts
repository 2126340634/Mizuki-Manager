import request from '../utils/request'

// 登录
export const login = (data: { username: string; password: string; captcha?: string }) => request.post({ url: '/mizuki/auth/login', data })

// 刷新验证码
export const refreshCaptchaBase64 = (data: { username: string }) => request.get({ url: '/mizuki/auth/refresh-captcha', data })

// 验证凭证
export const verifyToken = (data: { token: string }) => request.post({ url: '/mizuki/auth/verify', data })
