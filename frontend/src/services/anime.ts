import request from '../utils/request'

// 获取配置数据
export const getAnimeConfig = () => request.get({ url: '/mizuki/anime' })

// 写入配置数据
export const writeAnimeConfig = (data: any) => request.post({ url: '/mizuki/anime/write', data: { data } })

// 批量上传图片
export const uploadAnimeImages = (files: File[]) => request.upload({ url: '/mizuki/anime/upload', files })
