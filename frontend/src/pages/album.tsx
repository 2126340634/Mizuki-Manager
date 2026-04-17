import React, { useCallback, useEffect, useState } from 'react'
import {
	Layout,
	Menu,
	Card,
	Button,
	Space,
	Modal,
	Input,
	Typography,
	Upload,
	Empty,
	Spin,
	Row,
	Col,
	Drawer,
	Grid,
	Image,
	message,
	Checkbox,
	CheckboxProps,
	CheckboxChangeEvent,
	Popconfirm,
	Pagination
} from 'antd'
import { FolderOutlined, UploadOutlined, EditOutlined, PlusOutlined, FolderOpenOutlined, DeleteOutlined } from '@ant-design/icons'
import styles from '../styles/pages/album.module.scss'
import { getFolders, createFolder, deleteFolder, getFolderFiles, uploadAlbumFiles, deleteFiles, getInfo, updateInfo } from '../services/album'

const { Sider, Content } = Layout
const { useBreakpoint } = Grid

interface FolderItem {
	folderName: string
	folderPath: string
}
interface FileItem {
	filename: string
	filePath: string
	url: string
}

export default function Album() {
	const screens = useBreakpoint()
	const [loading, setLoading] = useState(false)
	const [folders, setFolders] = useState<FolderItem[]>([]) // 所有文件夹
	const [files, setFiles] = useState<FileItem[]>([]) // 当前文件夹下所有文件(分页)
	const [curFolderPath, setCurrentFolder] = useState<string>('') // 当前选中的文件夹路径
	const [drawerVisible, setDrawerVisible] = useState(false) // 移动端侧边抽屉
	const [isModalOpen, setIsModalOpen] = useState(false) // 配置编辑窗口
	const [infoContent, setInfoContent] = useState('') // 配置内容
	const [checkedPaths, setCheckedPaths] = useState<string[]>([]) // 选中对象的路径数组
	const [pageNum, setPageNum] = useState(1) // 当前页数
	const [pageSize, setPageSize] = useState(10) // 每页数量
	const [pageTotal, setPageTotal] = useState(0) // 相册图片总量

	// 点击全选
	const onCheckAllChange: CheckboxProps['onChange'] = useCallback(
		(e) => {
			setCheckedPaths(e.target.checked ? files.map((file) => file.filePath) : [])
		},
		[files]
	)

	// 处理勾选
	const onCheckChange = useCallback(
		(e: CheckboxChangeEvent, filePath: string) => {
			if (e.target.checked) setCheckedPaths([filePath, ...checkedPaths])
			else setCheckedPaths(checkedPaths.filter((path) => path !== filePath))
		},
		[checkedPaths]
	)

	// 获取所有文件夹
	const getAllFolders = useCallback(async () => {
		try {
			setLoading(true)
			const res = await getFolders()
			const data = res.data
			if (data) setFolders(data)
			else throw new Error('未从响应中获取到文件夹列表')
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	// 获取所有文件(分页)
	const getAllFiles = useCallback(async (folderPath: string, num: number, size: number) => {
		if (!folderPath) return
		try {
			setLoading(true)
			const res = await getFolderFiles(folderPath, num, size)
			const { files, total } = res.data || {}
			if (files) setFiles(files)
			if (total !== undefined) setPageTotal(total)
			else throw new Error('未从响应中获取到文件列表')
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	// 上传相册图片(批量)
	const uploadFiles = useCallback(
		async (file: File, fileList: File[]) => {
			if (file !== fileList[fileList.length - 1]) return // 只执行一次上传
			try {
				setLoading(true)
				const res = await uploadAlbumFiles(curFolderPath, fileList)
				if (res.success) message.success('上传成功')
			} catch {
			} finally {
				await getAllFiles(curFolderPath, pageNum, pageSize)
				setLoading(false)
			}
			return false
		},
		[curFolderPath, pageNum, pageSize, getAllFiles]
	)

	// 删除相册图片(批量)
	const removeFiles = useCallback(async () => {
		try {
			setLoading(true)
			const res = await deleteFiles(checkedPaths)
			if (res.success) message.success('删除成功')
			setCheckedPaths([])
		} catch {
		} finally {
			await getAllFiles(curFolderPath, pageNum, pageSize)
			setLoading(false)
		}
	}, [checkedPaths, curFolderPath, pageNum, pageSize, getAllFiles])

	// 保存配置修改
	const handleSaveInfo = useCallback(() => {
		setIsModalOpen(false)
	}, [])

	useEffect(() => {
		getAllFolders()
	}, [])

	// 分页改变
	const onPageChange = useCallback(
		async (page: number, pageSize: number) => {
			setPageNum(page)
			setPageSize(pageSize)
			setCheckedPaths([])
			await getAllFiles(curFolderPath, page, pageSize)
		},
		[getAllFiles, curFolderPath]
	)

	// 文件夹列表菜单
	const FolderMenu = useCallback(
		() => (
			<>
				<div style={{ padding: '16px' }}>
					<Button type="dashed" block icon={<PlusOutlined />}>
						新建目录
					</Button>
				</div>
				<Menu
					mode="inline"
					selectedKeys={[curFolderPath]}
					onClick={async ({ key }) => {
						setCurrentFolder(key) // 更新选中文件夹
						setCheckedPaths([]) // 清空全选
						setDrawerVisible(false)
						setPageNum(1)
						setPageSize(10)
						await getAllFiles(key, 1, 10)
					}}
					items={folders.map((folder) => ({ key: folder.folderPath, icon: <FolderOutlined />, label: folder.folderName }))}
				/>
			</>
		),
		[folders, curFolderPath, getAllFiles]
	)

	return (
		<Layout className={styles['layout-container']}>
			{/* PC侧边栏 */}
			{screens.lg ? (
				<Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
					<FolderMenu />
				</Sider>
			) : (
				/* 移动端 */
				<Drawer title="目录列表" placement="left" onClose={() => setDrawerVisible(false)} open={drawerVisible} size="80%" styles={{ body: { padding: 0 } }}>
					<FolderMenu />
				</Drawer>
			)}

			<Content style={{ padding: screens.md ? '24px' : '8px', overflowY: 'auto' }}>
				<Spin spinning={loading}>
					{/* 顶部标题与操作栏 */}
					<div className={styles.toolbar}>
						<div>
							{!screens.lg && <Button className={styles['toolbar-directory']} icon={<FolderOpenOutlined />} onClick={() => setDrawerVisible(true)} />}
							<Typography.Title level={4}>{folders.find((folder) => folder.folderPath === curFolderPath)?.folderName || '请选择目录'}</Typography.Title>
						</div>
						{curFolderPath && (
							<Space>
								{files.length > 0 ? (
									<Checkbox
										style={{ whiteSpace: 'nowrap' }}
										onChange={onCheckAllChange}
										indeterminate={checkedPaths.length > 0 && checkedPaths.length < files.length}
										checked={checkedPaths.length === files.length}
									>
										全选
									</Checkbox>
								) : (
									''
								)}
								{checkedPaths.length > 0 ? (
									<Popconfirm title="确定删除?" okText="确定" cancelText="取消" onConfirm={removeFiles} placement="bottom">
										<Button icon={<DeleteOutlined />}>删除</Button>
									</Popconfirm>
								) : (
									''
								)}
								<Button icon={<EditOutlined />} onClick={() => setIsModalOpen(true)}>
									配置
								</Button>
								<Upload showUploadList={false} beforeUpload={uploadFiles} multiple>
									<Button type="primary" icon={<UploadOutlined />}>
										上传
									</Button>
								</Upload>
							</Space>
						)}
					</div>

					{/* 文件列表 */}
					{curFolderPath && files.length > 0 ? (
						<>
							<Row gutter={[4, 4]} style={{ marginTop: 16 }}>
								{files.map((file, index) => (
									<Col key={index} xs={12} sm={8} md={12} lg={6}>
										<Card
											hoverable
											size="small"
											cover={
												<div className={styles.card}>
													<Image loading="lazy" height="100%" alt={file.filename} src={file.url} />
												</div>
											}
											actions={[<Checkbox checked={checkedPaths.includes(file.filePath)} onChange={(e) => onCheckChange(e, file.filePath)} />]}
										>
											<Card.Meta
												title={
													<Typography.Text style={{ fontSize: 12 }} ellipsis={{ tooltip: file.filename }}>
														{file.filename}
													</Typography.Text>
												}
											/>
										</Card>
									</Col>
								))}
							</Row>
							<Row>
								<Pagination
									size="small"
									showQuickJumper
									showSizeChanger
									current={pageNum}
									pageSize={pageSize}
									total={pageTotal}
									onChange={onPageChange}
									style={{ margin: '30px auto', whiteSpace: 'nowrap' }}
								/>
							</Row>
						</>
					) : (
						<Empty style={{ marginTop: 60 }} description={curFolderPath ? '空空如也~' : '请先选择目录'} />
					)}
				</Spin>
			</Content>

			{/* 配置编辑窗口 */}
			<Modal
				title="编辑文件夹配置"
				open={isModalOpen}
				mask={{ closable: false }}
				onOk={handleSaveInfo}
				onCancel={() => setIsModalOpen(false)}
				width={screens.md ? 800 : '95%'}
				centered
				okText="保存"
				cancelText="取消"
			>
				<Input.TextArea
					value={infoContent}
					onChange={(e) => setInfoContent(e.target.value)}
					placeholder="请输入配置内容"
					autoSize={{ minRows: 10, maxRows: 20 }}
					style={{ fontFamily: 'monospace', backgroundColor: '#fafafa', fontSize: screens.md ? 14 : 12 }}
				/>
			</Modal>
		</Layout>
	)
}
