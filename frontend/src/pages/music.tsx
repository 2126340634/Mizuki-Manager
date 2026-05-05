import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
	Card,
	Row,
	Col,
	Tag,
	Button,
	Modal,
	Form,
	Input,
	message,
	Space,
	Typography,
	Spin,
	Grid,
	Layout,
	Empty,
	Pagination,
	Checkbox,
	CheckboxProps,
	Popconfirm,
	Upload,
	Image,
	InputNumber
} from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { EditOutlined, DeleteOutlined, CustomerServiceOutlined, SoundOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons'
import { getMusicConfig, writeMusicConfig, uploadCoverFile, uploadMusicFile } from '../services/music'
import { throttle } from '../utils/util'
import styles from '../styles/pages/music.module.scss'
import { Content } from 'antd/es/layout/layout'
import { imageAccept, audioAccept } from '../configs/uploadConfig'

const { useBreakpoint } = Grid

interface Song {
	id: number | string
	title: string
	artist: string
	cover: string
	url: string
	duration: number
}

export default function Music() {
	const [msgApi, msgContextHolder] = message.useMessage()
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [musicList, setMusicList] = useState<Song[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const [pageList, setPageList] = useState<Song[]>([])
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [checkedIdxes, setCheckedIdxes] = useState<Set<number>>(new Set())

	const coverUrlValue = Form.useWatch('cover', form)
	const musicUrlValue = Form.useWatch('url', form)

	const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
		setCheckedIdxes(e.target.checked ? new Set(pageList.map((_, index) => index)) : new Set())
	}

	const _handleCheck = (needCheck: boolean, index: number) => {
		setCheckedIdxes((prev) => {
			const next = new Set(prev)
			if (needCheck) next.add(index)
			else next.delete(index)
			return next
		})
	}

	const onCheckChange = (e: CheckboxChangeEvent, index: number) => {
		e.stopPropagation()
		_handleCheck(e?.target?.checked as boolean, index)
	}

	const onPageChange = async (page: number, size: number) => {
		setCheckedIdxes(new Set())
		setPageNum(page)
		setPageSize(size)
		setPageList(musicList.slice((page - 1) * size, page * size) || [])
	}

	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getMusicConfig()
			if (res.success) {
				const data: Song[] = res.data?.LOCAL_PLAYLIST || []
				setMusicList(data)
				setPageList(data.slice((num - 1) * size, num * size) || [])
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	const openEditModal = (e: React.MouseEvent | undefined, index: number) => {
		e?.stopPropagation()
		setEditingIndex(index)
		form.resetFields()
		if (index !== -1) {
			form.setFieldsValue(pageList[index])
		} else {
			form.setFieldsValue({
				id: Date.now()
			})
		}
		setIsModalOpen(true)
	}

	const updateList = useCallback(
		async (newList: Song[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				const res = await writeMusicConfig({ LOCAL_PLAYLIST: newList })
				if (res.success) {
					msgApi.success(successMsg)
					setIsModalOpen(false)
					setCheckedIdxes(new Set())
					await getConfig(num, size)
				}
			} catch {
			} finally {
				setLoading(false)
			}
		},
		[getConfig]
	)

	// 上传音乐封面
	const uploadCover = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadCoverFile(file)
			console.log(res)
			if (res.success) {
				msgApi.success('上传成功')
				form.setFieldsValue({ cover: res.data?.[0]?.publicPath || '' })
			}
		} catch {
		} finally {
			setLoading(false)
			return false
		}
	}

	// 上传音频文件
	const uploadMusic = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadMusicFile(file)
			if (res.success) {
				msgApi.success('上传成功')
				form.setFieldsValue({ url: res.data?.[0]?.publicPath || '' })
			}
		} catch {
		} finally {
			setLoading(false)
			return false
		}
	}

	const _handleSave = useCallback(async () => {
		if (editingIndex === undefined) return
		try {
			const values = await form.validateFields()
			const newList = [...musicList]
			if (editingIndex !== -1) {
				const realIndex = musicList.findIndex((item) => item.id === pageList[editingIndex].id)
				if (realIndex !== -1) newList[realIndex] = values
			} else {
				newList.unshift(values)
			}
			await updateList(newList, editingIndex === -1 ? '添加成功' : '修改成功', pageNum, pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [updateList, musicList, editingIndex, pageList, pageNum, pageSize])

	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	const removeSongs = async () => {
		const removeIds = new Set(pageList.filter((_, index) => checkedIdxes.has(index)).map((i) => i.id))
		const newList = musicList.filter((item) => !removeIds.has(item.id))
		const newTotalPages = Math.max(1, Math.ceil(newList.length / pageSize))
		const newPageNum = Math.min(pageNum, newTotalPages)
		await updateList(newList, '删除成功', newPageNum, pageSize)
	}

	// 格式化时长 m:ss
	const formatDuration = (seconds: number) => {
		const min = Math.floor(seconds / 60)
		const sec = seconds % 60
		return `${min}:${sec.toString().padStart(2, '0')}`
	}

	useEffect(() => {
		getConfig(1, 12)
	}, [])

	return (
		<>
			{msgContextHolder}
			<Layout className={styles['layout-container']}>
				<Content style={{ padding: screens.md ? '24px' : '8px', overflowY: 'auto', height: '100vh' }}>
					<Spin spinning={loading}>
						<div className={styles.toolbar}>
							<div style={{ display: 'flex', flexDirection: 'column' }}>
								<Typography.Title level={4} style={{ margin: 0 }}>
									<CustomerServiceOutlined /> 歌单管理
								</Typography.Title>
								<Typography.Text type="secondary">管理音乐播放器列表</Typography.Text>
							</div>
						</div>

						<Space style={{ marginBottom: 16 }}>
							{pageList.length > 0 && (
								<Checkbox onChange={onCheckAllChange} indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length} checked={checkedIdxes.size === pageList.length}>
									全选
								</Checkbox>
							)}
							{checkedIdxes.size > 0 && (
								<Popconfirm title="确定删除选中的歌曲吗?" onConfirm={removeSongs} okText="确定" cancelText="取消">
									<Button loading={loading} danger icon={<DeleteOutlined />}>
										删除
									</Button>
								</Popconfirm>
							)}
							<Button loading={loading} icon={<EditOutlined />} onClick={() => openEditModal(undefined, -1)}>
								新增歌曲
							</Button>
						</Space>

						{pageList.length > 0 ? (
							<Row gutter={[8, 8]}>
								{pageList.map((item, index) => (
									<Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
										<Card
											hoverable
											size="small"
											onClick={() => _handleCheck(!checkedIdxes.has(index), index)}
											cover={
												<div style={{ height: 140, overflow: 'hidden', position: 'relative', background: '#f5f5f5' }}>
													{item.cover ? (
														<img loading="lazy" alt={item.title} src={item.cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
													) : (
														<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
															<PictureOutlined style={{ fontSize: 40, color: '#ccc' }} />
														</div>
													)}
												</div>
											}
											actions={[
												<EditOutlined key="edit" onClick={(e) => openEditModal(e, index)} />,
												<a key="play" href={item.url} target="_blank" onClick={(e) => e.stopPropagation()}>
													<SoundOutlined />
												</a>
											]}
										>
											<Checkbox
												style={{ position: 'absolute', right: 8, top: 8, zIndex: 1, opacity: checkedIdxes.has(index) ? 1 : 0.4 }}
												checked={checkedIdxes.has(index)}
												onChange={(e) => onCheckChange(e, index)}
											/>
											<Card.Meta
												title={item.title}
												description={
													<Typography.Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginBottom: 8 }}>
														{item.artist}
													</Typography.Paragraph>
												}
											/>
											<Space wrap size={[4, 0]} style={{ marginTop: 8 }}>
												<Tag style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDuration(item.duration)}</Tag>
											</Space>
										</Card>
									</Col>
								))}
							</Row>
						) : (
							<Empty style={{ marginTop: 60 }} description="暂未添加歌曲~" />
						)}

						{musicList.length > 0 && (
							<Row justify="center" style={{ marginTop: 32 }}>
								<Pagination
									size="small"
									showQuickJumper
									showSizeChanger
									current={pageNum}
									pageSize={pageSize}
									total={musicList.length}
									onChange={onPageChange}
									pageSizeOptions={[12, 24, 48, 96]}
									style={{ margin: '30px auto', whiteSpace: 'nowrap' }}
								/>
							</Row>
						)}
					</Spin>

					<Modal
						title={editingIndex === -1 ? '新增歌曲' : '编辑歌曲'}
						open={isModalOpen}
						onOk={throttledSave}
						onCancel={() => setIsModalOpen(false)}
						width={550}
						okText="保存"
						cancelText="取消"
						centered
						mask={{ closable: false }}
						destroyOnHidden
					>
						<Form form={form} layout="vertical">
							<Form.Item name="id" hidden>
								<Input />
							</Form.Item>
							<Row gutter={[8, 8]}>
								<Col xs={24} md={12}>
									<Form.Item name="title" label="歌曲名称" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
										<Input placeholder="输入歌曲名称" />
									</Form.Item>
								</Col>
								<Col xs={24} md={6}>
									<Form.Item name="artist" label="艺术家" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
										<Input placeholder="输入艺术家名称" />
									</Form.Item>
								</Col>
								<Col xs={24} md={6}>
									<Form.Item name="duration" label="时长(秒)" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
										<InputNumber min={1} max={600} style={{ width: '100%' }} placeholder="单位为秒" />
									</Form.Item>
								</Col>
								<Col span={24}>
									<div style={{ display: 'flex', flexDirection: screens.md ? 'row' : 'column', gap: screens.md ? 8 : 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
										<Form.Item style={{ flex: 1, marginBottom: 8 }} name="cover" label="封面图片" rules={[{ required: true }]}>
											<Space.Compact style={{ width: '100%' }}>
												<Form.Item name="cover" noStyle>
													<Input placeholder="输入图片链接" />
												</Form.Item>
												<Upload showUploadList={false} beforeUpload={uploadCover} accept={imageAccept}>
													<Button loading={loading} icon={<UploadOutlined />}>
														上传封面
													</Button>
												</Upload>
											</Space.Compact>
										</Form.Item>
										{coverUrlValue && <Image loading="lazy" width={screens.md ? 70 : '100%'} height={70} src={coverUrlValue} style={{ objectFit: 'contain' }} />}
									</div>
								</Col>
								<Col span={24}>
									<Form.Item style={{ marginBottom: 8 }} name="url" label="音频文件" rules={[{ required: true }]}>
										<Space.Compact style={{ width: '100%' }}>
											<Form.Item name="url" noStyle>
												<Input placeholder="输入音频链接" />
											</Form.Item>
											<Upload showUploadList={false} beforeUpload={uploadMusic} accept={audioAccept}>
												<Button loading={loading} icon={<UploadOutlined />}>
													上传音频
												</Button>
											</Upload>
										</Space.Compact>
									</Form.Item>
									{musicUrlValue && <audio controls src={musicUrlValue} style={{ width: '100%', height: 30, marginTop: 8 }} />}
								</Col>
							</Row>
						</Form>
					</Modal>
				</Content>
			</Layout>
		</>
	)
}
