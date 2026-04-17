import request from '../utils/request'

// 获取 About 内容
export const getAboutContent = () => request.get({ url: '/mizuki/about' })

// 更新 About 文本内容
export const updateAboutContent = (content: string) => request.post({ url: '/mizuki/about/update', data: { content } })

// 上传并替换 MD 文件
export const replaceAboutFile = (file: File) => request.upload({ url: '/mizuki/about/upload', file })
