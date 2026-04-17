import request from '../utils/request'

// 获取配置数据
export const getSkillConfig = () => request.get({ url: '/mizuki/skill' })

// 写入配置数据
export const writeSkillConfig = (data: any) => request.post({ url: '/mizuki/skill/write', data: { data } })
