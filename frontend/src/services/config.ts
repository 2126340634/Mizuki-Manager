import request from '../utils/request'

// 替换配置文件
export const replaceConfig = (file: File) => request.upload({ url: '/mizuki/config/replace', file })

// 获取配置数据
export const getConfigData = () => request.get({ url: '/mizuki/config' })

// 写入配置数据
export const writeConfigData = (data: any) => request.post({ url: '/mizuki/config/write', data: { data } })
