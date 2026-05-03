import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Layout,
	Menu,
	Card,
	Button,
	Space,
	Modal,
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
	MenuProps,
	Select,
	Form,
	DatePicker,
	Input,
	Switch,
	Alert
} from 'antd'
import { FolderOutlined, UploadOutlined, EditOutlined, PlusOutlined, FolderOpenOutlined, DeleteOutlined, EllipsisOutlined } from '@ant-design/icons'
import styles from '../styles/pages/album.module.scss'
import { getFolders, createFolder, deleteFolder, getFolderFiles, uploadAlbumFiles, deleteFiles, getInfo, updateInfo, renameFolder } from '../services/album'
import dayjs from 'dayjs'
import { throttle } from '../utils/util'
import { imageAccept } from '../configs/uploadConfig'

const { Sider, Content } = Layout
const { useBreakpoint } = Grid

type AlbumMode = 'external' | '' // 不设置则为本地模式
interface PhotoItem {
	src: string
	alt?: string
}
interface AlbumInfo {
	mode?: AlbumMode
	hidden?: boolean
	title?: string
	description?: string
	date?: string // 格式：YYYY-MM-DD
	location?: string
	tags?: string[]
	layout?: 'grid' | 'masonry'
	columns?: number // 默认 3
	// 外链模式
	cover?: string
	photos?: PhotoItem[]
}
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
	const [form] = Form.useForm()
	const currentMode: AlbumMode = Form.useWatch('mode', form)
	const [loading, setLoading] = useState(false)
	const [folders, setFolders] = useState<FolderItem[]>([]) // 所有文件夹
	const [files, setFiles] = useState<FileItem[]>([]) // 当前文件夹下所有文件(分页)
	const [curFolderPath, setCurFolderPath] = useState<string>('') // 当前选中的文件夹路径
	const [drawerVisible, setDrawerVisible] = useState(false) // 移动端侧边抽屉
	const [isModalOpen, setIsModalOpen] = useState(false) // 配置编辑窗口
	const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set()) // 选中对象的路径数组
	const [pageNum, setPageNum] = useState(1) // 当前页数
	const [pageSize, setPageSize] = useState(12) // 每页数量
	const [pageTotal, setPageTotal] = useState(0) // 相册图片总量

	// 全选
	const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
		setCheckedPaths(e.target.checked ? new Set(files.map((file) => file.filePath)) : new Set())
	}

	const _handleCheck = (needCheck: boolean, filePath: string) => {
		setCheckedPaths((prev) => {
			const next = new Set(prev)
			if (needCheck) {
				next.add(filePath)
			} else {
				next.delete(filePath)
			}
			return next
		})
	}

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

	// 选中目录
	const selectFolder = useCallback(
		async (folderPath: string) => {
			if (!folderPath) return
			setCurFolderPath(folderPath) // 更新选中文件夹
			setCheckedPaths(new Set()) // 清空全选
			setPageNum(1)
			setPageSize(12)
			await getAllFiles(folderPath, 1, 12)
		},
		[getAllFiles]
	)

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
			// 批量上传时如果有至少一个失败就会catch, 所以无论成功失败都要重新获取列表
			await getAllFiles(curFolderPath, pageNum, pageSize)
			setLoading(false)
		}
		return false
	}

	// 删除相册图片(批量)
	const removeFiles = async () => {
		const removePaths = Array.from(checkedPaths)
		// 删除后的分页总数
		const newTotalPages = Math.max(1, Math.ceil((pageTotal - removePaths.length) / pageSize))
		// 计算删除后应该更新的pageNum值
		const newPageNum = Math.min(pageNum, newTotalPages)
		try {
			setLoading(true)
			const res = await deleteFiles(removePaths)
			if (res.success) {
				message.success('删除成功')
				setCheckedPaths(new Set())
			}
		} catch {
		} finally {
			await getAllFiles(curFolderPath, newPageNum, pageSize)
			setLoading(false)
		}
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
	}, [getAllFolders, selectFolder, curFolderPath])

	// 删除文件夹
	const removeFolder = useCallback(() => {
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
	}, [getAllFolders, curFolderPath])

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

	// 获取配置
	const getInfoContent = useCallback(
		async (options: { openModal: boolean } = { openModal: true }) => {
			try {
				setLoading(true)
				const res = await getInfo(curFolderPath)
				if (res.success) {
					const data = JSON.parse(res.data) || {}
					form.setFieldsValue({
						mode: data.mode || '',
						hidden: data.hidden || false,
						title: data.title || '',
						description: data.description || '',
						date: dayjs(data.date) || null,
						location: data.location || '',
						tags: data.tags || [],
						layout: data.layout || 'grid',
						columns: data.columns || 3,
						// 外链模式
						cover: data.cover || '',
						photos: data.photos || [{ src: '', alt: '' }]
					})
					setIsModalOpen(options.openModal)
				}
			} catch {
			} finally {
				setLoading(false)
			}
		},
		[curFolderPath]
	)

	// 保存配置
	const _saveInfoContent = useCallback(async () => {
		try {
			setLoading(true)
			const values = await form.validateFields()
			const payload: AlbumInfo = {
				...values,
				date: values?.date?.format('YYYY-MM-DD') || '',
				photos: values?.photos?.filter((p: PhotoItem) => p.src)
			}
			const res = await updateInfo(curFolderPath, JSON.stringify(payload, null, 2))
			if (res.success) {
				message.success('保存成功')
				setIsModalOpen(false)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [getInfoContent, curFolderPath])
	const throttledSave = useMemo(() => throttle(_saveInfoContent, 2000, { immediate: true }), [_saveInfoContent])

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
			<Menu
				mode="inline"
				selectedKeys={[curFolderPath]}
				onClick={({ key }) => selectFolder(key)}
				items={menuItems}
				style={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', userSelect: 'none' }}
			/>
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
							<Typography.Title level={4}>{folders.find((folder) => folder.folderPath === curFolderPath)?.folderName || '选择相册目录'}</Typography.Title>
							{curFolderPath && (
								<Alert
									style={{ marginBottom: 16 }}
									title={
										<>
											本地模式下相册内必须存在一个名为{' '}
											<span
												style={{ fontWeight: 'bold', textDecoration: 'underline 1px #000', cursor: 'pointer' }}
												onClick={async () => {
													try {
														await navigator.clipboard.writeText('cover.jpg')
														message.success('已复制到剪切板')
													} catch {
														message.error('复制失败')
													}
												}}
											>
												cover.jpg
											</span>{' '}
											的图片作为封面。
										</>
									}
									type="info"
									showIcon
									closable
								/>
							)}
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
								) : null}
								{checkedPaths.size > 0 ? (
									<Popconfirm title="确定删除?" okText="确定" cancelText="取消" onConfirm={removeFiles} placement="bottom">
										<Button loading={loading} icon={<DeleteOutlined />}>
											删除
										</Button>
									</Popconfirm>
								) : null}
								<Button loading={loading} icon={<EditOutlined />} onClick={() => getInfoContent()}>
									配置
								</Button>
								<Upload showUploadList={false} beforeUpload={uploadFiles} multiple accept={imageAccept}>
									<Button loading={loading} type="primary" icon={<UploadOutlined />}>
										上传
									</Button>
								</Upload>
							</Space>
						)}
					</div>

					{/* 文件列表 */}
					{curFolderPath && files.length > 0 ? (
						<Row gutter={[4, 4]} style={{ marginTop: 16 }}>
							{files.map((file, index) => (
								<Col key={index} xs={12} sm={8} md={12} lg={6}>
									<Card
										hoverable
										size="small"
										cover={
											<div className={styles.cover} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
												{file.url && <Image loading="lazy" width="100%" height="100%" style={{ objectFit: 'contain' }} alt={file.filename} src={file.url} />}
											</div>
										}
										actions={[<Checkbox checked={checkedPaths.has(file.filePath)} onChange={(e) => onCheckChange(e, file.filePath)} />]}
										onClick={() => toggleCheck(file.filePath)}
									>
										<Card.Meta
											title={
												<Typography.Text style={{ fontSize: 12 }} ellipsis={{ tooltip: file.filename }}>
													<span style={{ color: '#999', fontWeight: 'lighter' }}>{file.filename === 'cover.jpg' ? '[封面]' : ''}</span> {file.filename}
												</Typography.Text>
											}
										/>
									</Card>
								</Col>
							))}
						</Row>
					) : (
						<Empty style={{ marginTop: 60 }} description={curFolderPath ? '空空如也~' : '先选择相册目录'} />
					)}
					{curFolderPath && pageTotal > 0 && (
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
					)}
				</Spin>
			</Content>

			{/* 配置编辑窗口 */}
			<Modal
				title="编辑相册配置"
				open={isModalOpen}
				mask={{ closable: false }}
				onOk={throttledSave}
				onCancel={() => setIsModalOpen(false)}
				width={screens.md ? (currentMode === 'external' ? 800 : 600) : '95%'}
				okText="保存"
				cancelText="取消"
				centered
				destroyOnHidden
				forceRender
			>
				<Form form={form} layout="vertical">
					<Row gutter={[8, 0]} style={{ marginTop: 16 }}>
						<Col xs={12} md={5}>
							<Form.Item style={{ marginBottom: 8 }} label="模式" name="mode">
								<Select
									options={[
										{ value: '', label: '本地模式' },
										{ value: 'external', label: '外链模式' }
									]}
								/>
							</Form.Item>
						</Col>

						<Col xs={12} md={4}>
							<Form.Item style={{ marginBottom: 8 }} label="隐藏相册" name="hidden" valuePropName="checked">
								<Switch checkedChildren="隐藏" unCheckedChildren="显示" />
							</Form.Item>
						</Col>

						<Col xs={24} md={15}>
							<Form.Item style={{ marginBottom: 8 }} label="相册标题" name="title">
								<Input placeholder="输入相册标题" />
							</Form.Item>
						</Col>

						<Col xs={24}>
							<Form.Item style={{ marginBottom: 8 }} label="相册描述" name="description">
								<Input.TextArea placeholder="输入相册描述" rows={3} showCount />
							</Form.Item>
						</Col>

						<Col xs={12} md={currentMode === 'external' ? 5 : 12}>
							<Form.Item style={{ marginBottom: 8 }} label="创建日期" name="date">
								<DatePicker placeholder="选择创建日期" style={{ width: '100%' }} format="YYYY-MM-DD" />
							</Form.Item>
						</Col>
						<Col xs={12} md={currentMode === 'external' ? 7 : 12}>
							<Form.Item style={{ marginBottom: 8 }} label="拍摄地点" name="location">
								<Input placeholder="输入拍摄地点" />
							</Form.Item>
						</Col>

						<Col xs={24} md={currentMode === 'external' ? 12 : 24}>
							<Form.Item style={{ marginBottom: 8 }} label="标签" name="tags">
								<Select mode="tags" placeholder="输入标签" tokenSeparators={[',', ';', '，', '；']} />
							</Form.Item>
						</Col>

						<Col xs={12} md={currentMode === 'external' ? 5 : 12}>
							<Form.Item style={{ marginBottom: 8 }} label="布局方式" name="layout">
								<Select
									options={[
										{ value: 'grid', label: '网格布局' },
										{ value: 'masonry', label: '瀑布流布局' }
									]}
								/>
							</Form.Item>
						</Col>
						<Col xs={12} md={currentMode === 'external' ? 7 : 12}>
							<Form.Item style={{ marginBottom: 8 }} label="列数" name="columns">
								<Select
									options={[
										{ value: 1, label: '1列' },
										{ value: 2, label: '2列' },
										{ value: 3, label: '3列' },
										{ value: 4, label: '4列' }
									]}
								/>
							</Form.Item>
						</Col>
						{currentMode === 'external' && (
							<>
								<Col xs={24} md={12}>
									<Form.Item style={{ marginBottom: 8 }} label="封面图片链接" name="cover" rules={[{ required: true }]}>
										<Input placeholder="输入封面图片URL" />
									</Form.Item>
								</Col>

								<Col xs={24}>
									<Form.List name="photos">
										{(fields, { add, remove }) => (
											<>
												<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
													<span style={{ fontWeight: 500 }}>相册图片列表</span>
													<Button type="dashed" onClick={() => add({ src: '', alt: '' })} icon={<PlusOutlined />}>
														添加图片
													</Button>
												</div>

												<div style={{ overflowY: 'auto', maxHeight: 420, display: 'grid', gridTemplateColumns: screens.md ? 'repeat(2, 1fr)' : '1fr', gap: 4 }}>
													{fields.map(({ key, name, ...restField }, index) => (
														<div key={key} style={{ marginBottom: 8, padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
															<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
																<span style={{ fontWeight: 500 }}>图片 {index + 1}</span>
																{fields.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}
															</div>

															<Row gutter={[12, 0]}>
																<Form.Item noStyle shouldUpdate>
																	{({ getFieldValue }) => {
																		const src = getFieldValue(['photos', name, 'src'])
																		const alt = getFieldValue(['photos', name, 'alt'])
																		return (
																			<>
																				<Col xs={src ? 16 : 24}>
																					<Row gutter={[0, 12]}>
																						<Col xs={24}>
																							<Form.Item {...restField} name={[name, 'src']} label="图片链接" style={{ margin: 0 }} rules={[{ required: index > 0 }]}>
																								<Input placeholder="输入图片URL" />
																							</Form.Item>
																						</Col>
																						<Col xs={24}>
																							<Form.Item {...restField} name={[name, 'alt']} label="图片描述" style={{ margin: 0 }}>
																								<Input placeholder="输入图片描述" />
																							</Form.Item>
																						</Col>
																					</Row>
																				</Col>
																				{src && (
																					<Col xs={8}>
																						<Image loading="lazy" height="100%" width="100%" style={{ objectFit: 'contain' }} alt={alt} src={src} />
																					</Col>
																				)}
																			</>
																		)
																	}}
																</Form.Item>
															</Row>
														</div>
													))}
												</div>
											</>
										)}
									</Form.List>
								</Col>
							</>
						)}
					</Row>
				</Form>
			</Modal>
		</Layout>
	)
}
