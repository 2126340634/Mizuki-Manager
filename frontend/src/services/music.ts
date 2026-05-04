import request from '../utils/request'

// 上传音乐封面
export const uploadCoverFile = (file: File) => request.upload({ url: '/mizuki/music/upload-cover', file })

// 上传音频文件
export const uploadMusicFile = (file: File) => request.upload({ url: '/mizuki/music/upload-music', file })

// 获取配置数据
export const getMusicConfig = () => request.get({ url: '/mizuki/music' })

// 写入配置数据
export const writeMusicConfig = (data: any) => request.post({ url: '/mizuki/music/write', data: { data } })
