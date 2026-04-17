import request from '../utils/request'

// 上传音乐(封面及音频)
export const uploadMusicFiles = (cover: File, music: File) => {
	const fd = new FormData()
	fd.append('cover', cover)
	fd.append('music', music)
	return request.upload({ url: '/mizuki/music/upload', file: fd })
}

// 获取配置数据
export const getMusicConfig = () => request.get({ url: '/mizuki/music' })

// 写入配置数据
export const writeMusicConfig = (data: any) => request.post({ url: '/mizuki/music/write', data: { data } })
