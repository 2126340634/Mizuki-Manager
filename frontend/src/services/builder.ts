import request from '../utils/request'

// 部署项目
export const deployProject = () => request.post({ url: '/mizuki/build/deploy' })
