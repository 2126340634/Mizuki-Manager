import request from '../utils/request'

export const getSystemInfo = () => request.get({ url: '/mizuki/system' })
