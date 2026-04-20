import request from '../utils/request'

// 文件夹操作
export const getFolders = () => request.get({ url: '/mizuki/album/folders' })
export const createFolder = (folderName: string) => request.post({ url: '/mizuki/album/create-folder', data: { folderName } })
export const deleteFolder = (folderPath: string) => request.delete({ url: '/mizuki/album/folder', data: { folderPath } })
export const renameFolder = (folderPath: string, newName: string) => request.post({ url: '/mizuki/album/rename', data: { folderPath, newName } })

// 文件操作
export const getFolderFiles = (folderPath: string, pageNum: number, pageSize: number) => request.get({ url: '/mizuki/album/files', data: { folderPath, pageNum, pageSize } })
export const uploadAlbumFiles = (folderPath: string, files: File[]) => request.upload({ url: '/mizuki/album/upload-files', files, data: { folderPath } })
export const deleteFiles = (filePaths: string[]) => request.delete({ url: '/mizuki/album/files', data: { filePaths } })

// 配置操作
export const getInfo = (folderPath: string) => request.get({ url: '/mizuki/album/info', data: { folderPath } })
export const updateInfo = (folderPath: string, content: string) => request.post({ url: '/mizuki/album/update-info', data: { folderPath, content } })
