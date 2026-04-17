import request from '../utils/request'

// 获取配置数据
export const getFriendConfig = () => request.get({ url: '/mizuki/friend' })

// 写入配置数据
export const writeFriendConfig = (data: any) => request.post({ url: '/mizuki/friend/write', data: { data } })
