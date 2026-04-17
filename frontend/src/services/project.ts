import request from '../utils/request'

// 批量上传图片
export const uploadProjectImages = (files: File[]) => request.upload({ url: '/mizuki/project/upload', files })

// 获取配置数据
export const getProjectConfig = () => request.get({ url: '/mizuki/project' })

// 写入配置数据
export const writeProjectConfig = (data: any) => request.post({ url: '/mizuki/project/write', data: { data } })
