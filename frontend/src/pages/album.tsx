import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
	Pagination,
	Dropdown,
	MenuProps
} from 'antd'
import { FolderOutlined, UploadOutlined, EditOutlined, PlusOutlined, FolderOpenOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons'
import styles from '../styles/pages/album.module.scss'
import { getFolders, createFolder, deleteFolder, getFolderFiles, uploadAlbumFiles, deleteFiles, getInfo, updateInfo, renameFolder } from '../services/album'

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
const dropdownOpts: MenuProps['items'] = [
	{
		label: '重命名',
		key: 'rename'
	},
	{
		label: '删除',
		key: 'delete'
	}
]

export default function Album() {
	const screens = useBreakpoint()
	const [loading, setLoading] = useState(false)
	const [folders, setFolders] = useState<FolderItem[]>([]) // 所有文件夹
	const [folderLimit, setFolderLimit] = useState(50) // 限制初始加载数量
	const [files, setFiles] = useState<FileItem[]>([]) // 当前文件夹下所有文件(分页)
	const [curFolderPath, setCurFolderPath] = useState<string>('') // 当前选中的文件夹路径
	const [drawerVisible, setDrawerVisible] = useState(false) // 移动端侧边抽屉
	const [isModalOpen, setIsModalOpen] = useState(false) // 配置编辑窗口
	const [infoContent, setInfoContent] = useState('') // 配置内容
	const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set()) // 选中对象的路径数组
	const [pageNum, setPageNum] = useState(1) // 当前页数
	const [pageSize, setPageSize] = useState(12) // 每页数量
	const [pageTotal, setPageTotal] = useState(0) // 相册图片总量

	// 点击全选
	const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
		setCheckedPaths(e.target.checked ? new Set(files.map((file) => file.filePath)) : new Set())
	}

	const _handleCheck = useCallback((needCheck: boolean, filePath: string) => {
		setCheckedPaths((prev) => {
			const next = new Set(prev)
			if (needCheck) {
				next.add(filePath)
			} else {
				next.delete(filePath)
			}
			return next
		})
	}, [])

	// 复选框勾选
	const onCheckChange = (e: CheckboxChangeEvent, filePath: string) => {
		e.stopPropagation()
		_handleCheck(e?.target?.checked, filePath)
	}

	// 切换复选框勾选
	const toggleCheck = (filePath: string) => {
		const needCheck = !checkedPaths.has(filePath)
		_handleCheck(needCheck, filePath)
	}

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
	const getAllFiles = async (folderPath: string, num: number, size: number) => {
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
	}

	// 选中目录
	const selectFolder = useCallback(async (folderPath: string) => {
		if (!folderPath) return
		setCurFolderPath(folderPath) // 更新选中文件夹
		setCheckedPaths(new Set()) // 清空全选
		setPageNum(1)
		setPageSize(12)
		await getAllFiles(folderPath, 1, 12)
	}, [])

	// 创建文件夹
	const addFolder = async () => {
		try {
			setLoading(true)
			const folderName = prompt('输入创建的目录名称')
			if (folderName === null) return
			if (!folderName?.trim()) {
				message.warning('目录名称不能为空')
				return
			}
			const res = await createFolder(folderName.trim())
			if (res.success) {
				message.success('创建成功')
				const { folderPath } = res.data || {}
				await getAllFolders()
				await selectFolder(folderPath)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	// 上传相册图片(批量)
	const uploadFiles = async (file: File, fileList: File[]) => {
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
	}

	// 删除相册图片(批量)
	const removeFiles = async () => {
		try {
			setLoading(true)
			const res = await deleteFiles(Array.from(checkedPaths))
			if (res.success) message.success('删除成功')
			setCheckedPaths(new Set())
		} catch {
		} finally {
			await getAllFiles(curFolderPath, pageNum, pageSize)
			setLoading(false)
		}
	}

	// 保存配置修改
	const handleSaveInfo = () => {
		setIsModalOpen(false)
	}

	useEffect(() => {
		getAllFolders()
	}, [])

	// 分页改变
	const onPageChange = async (page: number, pageSize: number) => {
		setPageNum(page)
		setPageSize(pageSize)
		setCheckedPaths(new Set())
		await getAllFiles(curFolderPath, page, pageSize)
	}

	// 重命名文件夹
	const modifyFolderName = useCallback(async () => {
		try {
			setLoading(true)
			const newName = prompt('输入新名称')
			if (newName === null) return
			if (!newName?.trim()) {
				message.warning('新名称不能为空')
				return
			}
			const res = await renameFolder(curFolderPath, newName.trim())
			if (res.success) {
				message.success('重命名成功')
				const { folderPath } = res.data || {}
				await getAllFolders()
				await selectFolder(folderPath)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [curFolderPath, getAllFolders, selectFolder])

	// 删除文件夹
	const removeFolder = () => {
		try {
			setLoading(true)
			Modal.confirm({
				centered: true,
				content: '确定删除?',
				onOk: async () => {
					const res = await deleteFolder(curFolderPath)
					if (res.success) {
						message.success('删除成功')
						setCurFolderPath('')
						await getAllFolders()
					}
				}
			})
		} catch {
		} finally {
			setLoading(false)
		}
	}

	// 更多选项点击
	const dropdownClick = useCallback(
		(e: { key: string }) => {
			const func: Record<string, Function> = {
				rename: modifyFolderName,
				delete: removeFolder
			}
			func[e.key]()
		},
		[modifyFolderName, removeFolder]
	)

	const menuItems = useMemo(() => {
		return folders.map((folder) => ({
			key: folder.folderPath,
			icon: <FolderOutlined />,
			label: folder.folderName,
			extra: curFolderPath === folder.folderPath && (
				<div onClick={(e) => e.stopPropagation()}>
					<Dropdown menu={{ items: dropdownOpts, onClick: dropdownClick }} trigger={['click']}>
						{<Button icon={<EllipsisOutlined />} type="text" />}
					</Dropdown>
				</div>
			)
		}))
	}, [folders, curFolderPath, dropdownClick])

	// 文件夹列表
	const FolderMenu: React.FC = () => (
		<>
			<div style={{ padding: '16px' }}>
				<Button type="dashed" block icon={<PlusOutlined />} onClick={addFolder}>
					新建目录
				</Button>
			</div>
			<Menu mode="inline" selectedKeys={[curFolderPath]} onClick={({ key }) => selectFolder(key)} items={menuItems} style={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }} />
		</>
	)

	return (
		<Layout className={styles['layout-container']}>
			{/* PC侧边栏 */}
			{screens.lg ? (
				<Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
					{<FolderMenu />}
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
										indeterminate={checkedPaths.size > 0 && checkedPaths.size < files.length}
										checked={checkedPaths.size === files.length}
									>
										全选
									</Checkbox>
								) : (
									''
								)}
								{checkedPaths.size > 0 ? (
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
												<div className={styles.card} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
													<Image loading="lazy" height="100%" alt={file.filename} src={file.url} />
												</div>
											}
											actions={[<Checkbox checked={checkedPaths.has(file.filePath)} onChange={(e) => onCheckChange(e, file.filePath)} />]}
											onClick={() => toggleCheck(file.filePath)}
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
									pageSizeOptions={[12, 24, 48, 96]}
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
