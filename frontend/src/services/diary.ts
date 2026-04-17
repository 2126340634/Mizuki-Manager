import request from '../utils/request'

// 批量上传图片
export const uploadDiaryImages = (files: File[]) => request.upload({ url: '/mizuki/diary/upload', files })

// 获取配置数据
export const getDiaryConfig = () => request.get({ url: '/mizuki/diary' })

// 写入配置数据
export const writeDiaryConfig = (data: any) => request.post({ url: '/mizuki/diary/write', data: { data } })
