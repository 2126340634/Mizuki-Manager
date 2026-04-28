import request from '../utils/request'

// 获取配置数据
export const getConfigData = () => request.get({ url: '/mizuki/config' })

// 写入配置数据
export const writeConfigData = (data: any) => request.post({ url: '/mizuki/config/write', data: { data } })
