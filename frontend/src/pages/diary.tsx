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
	Upload,
	Image,
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
	CheckboxChangeEvent,
	DatePicker,
	Select
} from 'antd'
import { EditOutlined, UploadOutlined, DeleteOutlined, BookOutlined, EnvironmentOutlined, SmileOutlined } from '@ant-design/icons'
import { getDiaryConfig, writeDiaryConfig, uploadDiaryImages } from '../services/diary'
import { throttle } from '../utils/util'
import styles from '../styles/pages/diary.module.scss'
import { Content } from 'antd/es/layout/layout'
import { imageAccept } from '../configs/uploadConfig'
import dayjs from 'dayjs'

const { useBreakpoint } = Grid

interface DiaryItem {
	id: number
	content: string
	date: string
	images?: string[]
	location?: string
	mood?: string
	tags?: string[]
}

export default function Diary() {
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [diaryList, setDiaryList] = useState<DiaryItem[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const [pageList, setPageList] = useState<DiaryItem[]>([])
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [checkedIdxes, setCheckedIdxes] = useState<Set<number>>(new Set())

	const imagesValue = Form.useWatch('images', form)

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
		_handleCheck(e?.target?.checked, index)
	}

	const onPageChange = async (page: number, size: number) => {
		setCheckedIdxes(new Set())
		setPageNum(page)
		setPageSize(size)
		setPageList(diaryList.slice((page - 1) * size, page * size) || [])
	}

	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getDiaryConfig()
			if (res.success) {
				const data: DiaryItem[] = res.data?.diaryData || []
				// 按日期最新倒序排列
				const sortedData = data.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
				setDiaryList(sortedData)
				setPageList(sortedData.slice((num - 1) * size, num * size) || [])
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
			// 修改
			const item = pageList[index]
			form.setFieldsValue({ ...item, date: dayjs(item.date) })
		} else {
			// 新增
			form.setFieldsValue({ date: dayjs(), id: Date.now() })
		}
		setIsModalOpen(true)
	}

	const updateList = useCallback(
		async (newList: DiaryItem[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				const res = await writeDiaryConfig({ diaryData: newList })
				if (res.success) {
					message.success(successMsg)
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

	const _handleSave = useCallback(async () => {
		if (editingIndex === undefined) return
		try {
			const values = await form.validateFields()
			const formattedValues = {
				...values,
				date: values.date.toISOString()
			}
			const newList = [...diaryList]
			if (editingIndex !== -1) {
				const realIndex = diaryList.findIndex((item) => item.id === pageList[editingIndex].id)
				if (realIndex !== -1) newList.splice(realIndex, 1)
			}
			newList.unshift(formattedValues)
			await updateList(newList, editingIndex === -1 ? '记录成功' : '修改成功', pageNum, pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [updateList, diaryList, editingIndex, form, pageList, pageNum, pageSize])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	const handleUpload = async (file: File, fileList: File[]) => {
		if (file === fileList[fileList.length - 1]) {
			try {
				setLoading(true)
				const res = await uploadDiaryImages(fileList)
				if (res.success) {
					const newUrls = res.data?.map((item: any) => item.publicPath) || []
					const curImages = form.getFieldValue('images') || []
					form.setFieldsValue({ images: [...curImages, ...newUrls] })
					message.success('上传成功')
				}
			} catch {
			} finally {
				setLoading(false)
				return false
			}
		}
	}

	const removeDiary = async () => {
		const removeIds = new Set(pageList.filter((_, index) => checkedIdxes.has(index)).map((i) => i.id))
		const newList = diaryList.filter((item) => !removeIds.has(item.id))
		// 删除后的分页总数
		const newTotalPages = Math.max(1, Math.ceil(newList.length / pageSize))
		// 计算删除后应该更新的pageNum值
		const newPageNum = Math.min(pageNum, newTotalPages)
		await updateList(newList, '删除成功', newPageNum, pageSize)
	}

	useEffect(() => {
		getConfig(1, 12)
	}, [])

	return (
		<Layout className={styles['layout-container']}>
			<Content style={{ padding: screens.md ? '24px' : '8px', overflowY: 'auto', height: '100vh' }}>
				<Spin spinning={loading}>
					<div className={styles.toolbar}>
						<div style={{ display: 'flex', flexDirection: 'column' }}>
							<Typography.Title level={4} style={{ margin: 0 }}>
								<BookOutlined /> 日记管理
							</Typography.Title>
							<Typography.Text type="secondary">记录生活中的每一个瞬间</Typography.Text>
						</div>
					</div>

					<Space>
						{pageList.length > 0 && (
							<Checkbox onChange={onCheckAllChange} indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length} checked={checkedIdxes.size === pageList.length}>
								全选
							</Checkbox>
						)}
						{checkedIdxes.size > 0 && (
							<Popconfirm title="确定删除选中的日记吗?" onConfirm={removeDiary} okText="确定" cancelText="取消">
								<Button loading={loading} icon={<DeleteOutlined />}>
									删除
								</Button>
							</Popconfirm>
						)}
						<Button icon={<EditOutlined />} onClick={() => openEditModal(undefined, -1)}>
							写日记
						</Button>
					</Space>

					{pageList.length > 0 ? (
						<Row gutter={[8, 8]} style={{ marginTop: 16 }}>
							{pageList.map((item, index) => (
								<Col key={item.id} xs={24} sm={12} md={12} lg={8}>
									<Card hoverable size="small" onClick={() => _handleCheck(!checkedIdxes.has(index), index)} actions={[<EditOutlined key="edit" onClick={(e) => openEditModal(e, index)} />]}>
										<div style={{ position: 'relative' }}>
											<Checkbox style={{ position: 'absolute', right: 0, top: 0, zIndex: 1 }} checked={checkedIdxes.has(index)} onChange={(e) => onCheckChange(e, index)} />
											<Typography.Text type="secondary" style={{ fontSize: 12 }}>
												{dayjs(item.date).format('YYYY-MM-DD HH:mm')}
											</Typography.Text>
											<Typography.Paragraph ellipsis={{ rows: 5 }} style={{ whiteSpace: 'pre-wrap' }}>
												{item.content}
											</Typography.Paragraph>

											{item.images && item.images.length > 0 && (
												<div onClick={(e) => e.stopPropagation()} style={{ maxHeight: 120, overflow: 'auto', scrollbarWidth: 'thin' }}>
													<Image.PreviewGroup>
														{item.images.map((img: string, idx: number) => (
															<Image loading="lazy" key={idx} src={img} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} />
														))}
													</Image.PreviewGroup>
												</div>
											)}

											{(item.mood || item.location || (item.tags && item.tags.length > 0)) && (
												<Space wrap style={{ marginTop: 8 }}>
													{item.mood && (
														<Tag icon={<SmileOutlined />} color="orange" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															{item.mood}
														</Tag>
													)}
													{item.location && (
														<Tag icon={<EnvironmentOutlined />} color="blue" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															{item.location}
														</Tag>
													)}
													{item.tags?.map((tag: string) => (
														<Tag key={tag} style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
															#{tag}
														</Tag>
													))}
												</Space>
											)}
										</div>
									</Card>
								</Col>
							))}
						</Row>
					) : (
						<Empty style={{ marginTop: 60 }} description="目前还没有记录哦" />
					)}

					{diaryList.length > 0 && (
						<Row>
							<Pagination
								size="small"
								showQuickJumper
								showSizeChanger
								current={pageNum}
								pageSize={pageSize}
								total={diaryList.length}
								onChange={onPageChange}
								pageSizeOptions={[12, 24, 48, 96]}
								style={{ margin: '30px auto', whiteSpace: 'nowrap' }}
							/>
						</Row>
					)}
				</Spin>

				<Modal
					title={editingIndex === -1 ? '添加日记' : '修改日记'}
					open={isModalOpen}
					onOk={throttledSave}
					onCancel={() => setIsModalOpen(false)}
					width={screens.md ? 600 : '95%'}
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
						<Row gutter={8}>
							<Col xs={24} md={12}>
								<Form.Item name="date" label="时间" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<DatePicker showTime style={{ width: '100%' }} />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="mood" label="心情" style={{ marginBottom: 8 }}>
									<Input prefix={<SmileOutlined />} placeholder="现在的状态" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="content" label="正文" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Input.TextArea placeholder="此刻在想什么..." rows={10} />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item label="添加图片" style={{ marginBottom: 8 }}>
									<Space wrap>
										<Upload showUploadList={false} beforeUpload={handleUpload} accept={imageAccept} multiple>
											<Button loading={loading} icon={<UploadOutlined />}>
												上传图片
											</Button>
										</Upload>
										<Form.Item name="images" noStyle>
											<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
												{imagesValue?.map((url: string, i: number) => (
													<div key={i} style={{ position: 'relative' }}>
														<Image loading="lazy" src={url} width={60} height={60} style={{ objectFit: 'cover' }} />
														<DeleteOutlined
															style={{ position: 'absolute', top: -4, right: -4, color: 'red', cursor: 'pointer' }}
															onClick={() => {
																const next = imagesValue.filter((_: any, idx: number) => idx !== i)
																form.setFieldsValue({ images: next })
															}}
														/>
													</div>
												))}
											</div>
										</Form.Item>
									</Space>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="location" label="地点" style={{ marginBottom: 8 }}>
									<Input prefix={<EnvironmentOutlined />} placeholder="在哪里？" />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="tags" label="标签" style={{ marginBottom: 8 }}>
									<Select mode="tags" placeholder="添加标签" style={{ width: '100%' }} />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</Content>
		</Layout>
	)
}
