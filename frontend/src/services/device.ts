import request from '../utils/request'

// 批量上传图片
export const uploadDeviceImages = (files: File[]) => request.upload({ url: '/mizuki/device/upload', files })

// 获取配置数据
export const getDeviceConfig = () => request.get({ url: '/mizuki/device' })

// 写入配置数据
export const writeDeviceConfig = (data: any) => request.post({ url: '/mizuki/device/write', data: { data } })
