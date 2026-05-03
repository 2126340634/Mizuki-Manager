import request from '../utils/request'

// 获取全部文章
export const getAllPosts = (pageNum: number, pageSize: number) => request.get({ url: '/mizuki/post', data: { pageNum, pageSize } })

// 获取单个文章内容
export const getPostContent = (filename: string) => request.get({ url: '/mizuki/post/content', data: { filename } })

// 更新文章内容
export const updatePost = (filename: string, content: string) => request.post({ url: '/mizuki/post/update', data: { filename, content } })

// 创建新文章
export const createPost = (filename: string, content: string) => request.post({ url: '/mizuki/post/create', data: { filename, content } })

// 上传 MD 文件
export const uploadPostFile = (file: File) => request.upload({ url: '/mizuki/post/upload', file })

// 删除文章
export const deletePost = (filename: string) => request.delete({ url: '/mizuki/post', data: { filename } })
