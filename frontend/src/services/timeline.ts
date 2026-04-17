import request from '../utils/request'

// 获取配置数据
export const getTimelineConfig = () => request.get({ url: '/mizuki/timeline' })

// 写入配置数据
export const writeTimelineConfig = (data: any) => request.post({ url: '/mizuki/timeline/write', data: { data } })
