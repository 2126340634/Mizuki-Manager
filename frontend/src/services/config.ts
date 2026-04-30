import request from '../utils/request'

// // 上传Icon或Logo图片
export const uploadHomeImage = (file: File) => request.upload({ url: '/mizuki/config/upload-home', file })

// // 上传PC壁纸(批量)
export const uploadPCWallpapers = (files: File[]) => request.upload({ url: '/mizuki/config/upload-pc', files })

// // 上传移动端壁纸(批量)
export const uploadMobileWallpapers = (files: File[]) => request.upload({ url: '/mizuki/config/upload-mobile', files })

// // 上传头像图片
export const uploadAvatarImage = (file: File) => request.upload({ url: '/mizuki/config/upload-avatar', file })

// 获取配置数据
export const getConfigData = () => request.get({ url: '/mizuki/config' })

// 写入配置数据
export const writeConfigData = (data: any) => request.post({ url: '/mizuki/config/write', data: { data } })
