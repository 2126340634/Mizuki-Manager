import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
	Card,
	Row,
	Col,
	Tag,
	Progress,
	Button,
	Modal,
	Form,
	Input,
	Select,
	message,
	Upload,
	Image,
	Space,
	Typography,
	Spin,
	Grid,
	Layout,
	DatePicker,
	InputNumber,
	Empty,
	Pagination,
	Checkbox,
	CheckboxProps,
	Popconfirm,
	CheckboxChangeEvent
} from 'antd'
import { EditOutlined, UploadOutlined, LinkOutlined, StarFilled, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { getAnimeConfig, writeAnimeConfig, uploadAnimeImages } from '../services/anime'
import { compareMonth, throttle } from '../utils/util'
import styles from '../styles/pages/anime.module.scss'
import { Content } from 'antd/es/layout/layout'
import dayjs from 'dayjs'
import { imageAccept } from '../configs/uploadConfig'

const { useBreakpoint } = Grid
const statusOpts = [
	{ label: '在看', value: 'watching' },
	{ label: '看过', value: 'completed' },
	{ label: '想看', value: 'planned' }
]

interface AnimeItem {
	title: string
	status: 'watching' | 'completed' | 'planned'
	rating: number
	cover: string
	description: string
	episodes: string
	year: string
	genre: string[]
	studio: string
	link: string
	progress: number
	totalEpisodes: number
	startDate: string
	endDate?: string
}

// 接收数据
interface AnimeData {
	localAnimeList: AnimeItem[]
}

export default function Anime() {
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [animeList, setAnimeList] = useState<AnimeItem[]>([]) // 总数据列表
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>() // 当前编辑的anime索引 -1为新增模式
	const [pageList, setPageList] = useState<AnimeItem[]>([]) // 当前分页数据列表
	const [pageNum, setPageNum] = useState(1) // 当前页数
	const [pageSize, setPageSize] = useState(12) // 每页数量
	const [checkedIdxes, setCheckedIdxes] = useState<Set<number>>(new Set()) // 选中对象的索引数组

	const coverValue = Form.useWatch('cover', form)

	// 全选
	const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
		setCheckedIdxes(e.target.checked ? new Set(pageList.map((_, index) => index)) : new Set())
	}

	const _handleCheck = (needCheck: boolean, index: number) => {
		setCheckedIdxes((prev) => {
			const next = new Set(prev)
			if (needCheck) {
				next.add(index)
			} else {
				next.delete(index)
			}
			return next
		})
	}

	// 复选框勾选
	const onCheckChange = (e: CheckboxChangeEvent, index: number) => {
		e.stopPropagation()
		_handleCheck(e?.target?.checked, index)
	}

	// 切换复选框勾选
	const toggleCheck = (index: number) => {
		const needCheck = !checkedIdxes.has(index)
		_handleCheck(needCheck, index)
	}

	// 分页改变
	const onPageChange = async (page: number, pageSize: number) => {
		setCheckedIdxes(new Set())
		setPageNum(page)
		setPageSize(pageSize)
		setPageList(animeList.slice((page - 1) * pageSize, page * pageSize) || [])
	}

	// 获取配置
	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getAnimeConfig()
			if (res.success) {
				if (!res.data) throw new Error('未从响应中获取到配置数据')
				const data = (res.data as AnimeData)?.localAnimeList
				setAnimeList(data || [])
				setPageList(data.slice((num - 1) * size, num * size) || [])
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	// 打开编辑窗口
	const openEditModal = (e: React.MouseEvent | undefined, index: number) => {
		e?.stopPropagation()
		setEditingIndex(index)
		form.resetFields()
		if (index !== -1) {
			// 修改回显数据
			const data = pageList[index]
			form.setFieldsValue({
				...data,
				year: data.year ? dayjs(data.year) : null,
				startDate: data.startDate ? dayjs(data.startDate) : null,
				endDate: data.endDate ? dayjs(data.endDate) : null
			})
		}
		setIsModalOpen(true)
	}

	// 更新总列表
	const updateList = useCallback(
		async (newList: AnimeItem[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				const res = await writeAnimeConfig({ localAnimeList: newList })
				if (res.success) {
					if (successMsg) message.success(successMsg)
					setIsModalOpen(false)
					setCheckedIdxes(new Set()) // 清空选中项
					await getConfig(num, size)
				}
			} catch {
			} finally {
				setLoading(false)
			}
		},
		[getConfig]
	)

	// 保存编辑
	const _handleSave = useCallback(async () => {
		if (editingIndex === undefined) return
		try {
			setLoading(true)
			const values = await form.validateFields()
			const newList = [...animeList]
			if (editingIndex !== -1) {
				// 修改模式
				// 找到当前item在总列表的索引,浅拷贝内存地址一致
				const realIndex = animeList.findIndex((item) => item === pageList[editingIndex])
				if (realIndex === -1) return
				newList.splice(realIndex, 1) // 先移除该元素
			}
			// 新增或修改模式都要重新置顶
			newList.unshift({
				...values,
				year: values.year ? values.year.format('YYYY') : '',
				startDate: values.startDate ? values.startDate.format('YYYY-MM') : '',
				endDate: values.endDate ? values.endDate.format('YYYY-MM') : '',
				episodes: `${values.totalEpisodes} episodes`
			})
			await updateList(newList, editingIndex === -1 ? '添加成功' : '修改成功', pageNum, pageSize) // 更新总列表
		} catch {
		} finally {
			setLoading(false)
		}
	}, [updateList, animeList, editingIndex, form])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	// 上传封面
	const uploadCover = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadAnimeImages([file])
			if (res.success) {
				message.success('上传成功')
				form.setFieldsValue({ cover: res.data?.[0]?.publicPath || '' })
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	// 删除选中
	const removeAnime = async () => {
		const removeItems: Set<AnimeItem> = new Set(pageList.filter((_, index) => checkedIdxes.has(index)))
		const newList = animeList.filter((item) => !removeItems.has(item)) // pageList由animeList截取得到(浅拷贝),数组内都是相同内存地址的对象
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
			<Content className={styles.content}>
				<Spin spinning={loading}>
					{/* 顶部标题与操作栏 */}
					<div className={styles.toolbar}>
						<div className={styles.toolbarTitle}>
							<Typography.Title level={4} className={styles.pageTitle}>
								<PlayCircleOutlined /> 追番记录
							</Typography.Title>
							<Typography.Text type="secondary">管理追番数据</Typography.Text>
						</div>
					</div>

					<Space>
						{pageList.length > 0 ? (
							<Checkbox
								className={styles.checkbox}
								onChange={onCheckAllChange}
								indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length}
								checked={checkedIdxes.size === pageList.length}
							>
								全选
							</Checkbox>
						) : null}
						{checkedIdxes.size > 0 ? (
							<Popconfirm title="确定删除?" okText="确定" cancelText="取消" onConfirm={removeAnime} placement="bottom">
								<Button loading={loading} icon={<DeleteOutlined />}>
									删除
								</Button>
							</Popconfirm>
						) : null}
						<Button loading={loading} icon={<EditOutlined />} onClick={() => openEditModal(undefined, -1)}>
							添加追番
						</Button>
					</Space>

					{pageList.length > 0 ? (
						<Row gutter={[4, 4]} className={styles.animeListRow}>
							{pageList.map((anime, index) => (
								<Col key={index} xs={12} sm={8} md={12} lg={6}>
									<Card
										className={styles.card}
										hoverable
										size="small"
										cover={
											<div className={styles.cover} onClick={(e) => e.stopPropagation()}>
												{anime.cover && <Image loading="lazy" height="100%" width="100%" className={styles.coverImage} src={anime.cover} alt={anime.title} />}
												<Tag color="black" className={styles.tag}>
													{anime.year}
												</Tag>
												{(() => {
													const selected = checkedIdxes.has(index)
													return <Checkbox className={styles.coverCheckbox} style={{ opacity: selected ? 1 : 0.4 }} checked={selected} onChange={(e) => onCheckChange(e, index)} />
												})()}
											</div>
										}
										actions={[
											<a href={anime.link} target="_blank" onClick={(e) => e.stopPropagation()}>
												<LinkOutlined />
											</a>,
											<EditOutlined onClick={(e) => openEditModal(e, index)} />
										]}
										onClick={() => toggleCheck(index)}
									>
										<Card.Meta
											title={
												<div className={styles.cardTitle}>
													<Typography.Text ellipsis={{ tooltip: anime.title }} className={styles.animeTitle}>
														{anime.title}
													</Typography.Text>
													<Typography.Text ellipsis={{ tooltip: anime.description }} className={styles.animeDescription}>
														{anime.description}
													</Typography.Text>
												</div>
											}
											description={
												<Space orientation="vertical" className={styles.cardDescription}>
													<div className={styles.ratingWrapper}>
														<div className={styles.rating}>
															<StarFilled className={styles.starIcon} />
															{Number(anime.rating || 0).toFixed(1)}
														</div>
														<Typography.Text type="secondary">{anime.status === 'watching' ? '在看' : anime.status === 'completed' ? '看过' : '想看'}</Typography.Text>
													</div>
													<Progress percent={Math.round((anime.progress / anime.totalEpisodes) * 100)} size="small" strokeColor={anime.status === 'completed' ? '#52c41a' : '#1890ff'} />
												</Space>
											}
										/>
									</Card>
								</Col>
							))}
						</Row>
					) : (
						<Empty className={styles.empty} description="快来开启你的追番生涯吧~" />
					)}
					{animeList.length > 0 && (
						<Row>
							<Pagination
								size="small"
								showQuickJumper
								showSizeChanger
								current={pageNum}
								pageSize={pageSize}
								total={animeList.length}
								onChange={onPageChange}
								pageSizeOptions={[12, 24, 48, 96]}
								className={styles.pagination}
							/>
						</Row>
					)}
				</Spin>

				{/* --- 编辑弹窗 --- */}
				<Modal
					title="编辑番剧信息"
					open={isModalOpen}
					onOk={throttledSave}
					onCancel={() => setIsModalOpen(false)}
					mask={{ closable: false }}
					width={screens.md ? 600 : '95%'}
					okText="保存"
					cancelText="取消"
					centered
					destroyOnHidden
					forceRender
				>
					<Form form={form} layout="vertical">
						<Row gutter={[8, 0]}>
							<Col span={24}>
								<Form.Item className={styles.modalFormItem} name="title" label="番剧标题" rules={[{ required: true }]}>
									<Input placeholder="输入番剧标题" className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item className={styles.modalFormItem} name="year" label="发布年份" rules={[{ required: true }]}>
									<DatePicker placeholder="选择发布年份" picker="year" className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col span={16}>
								<Form.Item className={styles.modalFormItem} name="studio" label="制作公司" rules={[{ required: true }]}>
									<Input placeholder="例如: CloverWorks" className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col span={24}>
								<div className={styles.coverUploadWrapper}>
									<Form.Item className={styles.modalFormItem} name="cover" label="封面图片" rules={[{ required: true }]}>
										<Space.Compact className={styles.fullWidth}>
											<Form.Item name="cover" noStyle>
												<Input placeholder="输入图片外链" />
											</Form.Item>
											<Upload showUploadList={false} beforeUpload={uploadCover} accept={imageAccept}>
												<Button loading={loading} icon={<UploadOutlined />}>
													上传
												</Button>
											</Upload>
										</Space.Compact>
									</Form.Item>
									{coverValue && <Image width={screens.md ? 100 : '100%'} height={80} loading="lazy" src={coverValue} alt={coverValue || ''} className={styles.modalCoverImage} />}
								</div>
							</Col>
							<Col span={24}>
								<Form.Item className={styles.modalFormItem} name="link" label="观看链接" rules={[{ required: true }]}>
									<Input placeholder="输入观看链接 (例如B站)" className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item className={styles.modalFormItem} name="description" label="番剧描述" rules={[{ required: true }]}>
									<Input.TextArea placeholder="输入番剧描述" rows={3} className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item className={styles.modalFormItem} name="genre" label="番剧类型" rules={[{ required: true }]}>
									<Select mode="tags" className={styles.fullWidth} placeholder="输入标签后按回车" tokenSeparators={[',', '，']} />
								</Form.Item>
							</Col>
							<Col xs={12} md={8}>
								<Form.Item className={styles.modalFormItem} name="rating" label="评分 (0-10)" rules={[{ required: true }]}>
									<InputNumber placeholder="输入番剧评分" min={0} max={10} formatter={(value) => Number(value)?.toFixed(1) || ''} className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col xs={12} md={8}>
								<Form.Item
									className={styles.modalFormItem}
									name="progress"
									label="观看集数"
									dependencies={['totalEpisodes']}
									rules={[
										{ required: true },
										{
											validator(_, value) {
												if (value > (form.getFieldValue('totalEpisodes') || 0)) return Promise.reject(new Error('不能超过总集数'))
												return Promise.resolve()
											}
										}
									]}
								>
									<InputNumber placeholder="输入观看集数" min={0} formatter={(value) => Number(value)?.toFixed(0) || ''} className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col xs={12} md={8}>
								<Form.Item className={styles.modalFormItem} name="totalEpisodes" label="总集数" rules={[{ required: true }]}>
									<InputNumber placeholder="输入总集数" min={0} formatter={(value) => Number(value)?.toFixed(0) || ''} className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col xs={12} md={8}>
								<Form.Item className={styles.modalFormItem} name="status" label="观看状态" rules={[{ required: true }]}>
									<Select placeholder="选择观看状态" options={statusOpts} className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col xs={12} md={8}>
								<Form.Item
									className={styles.modalFormItem}
									name="startDate"
									label="开始日期"
									dependencies={['endDate']}
									rules={[
										{ required: true },
										{
											validator(_, value) {
												const endTimeStr = form.getFieldValue('endDate')?.format('YYYY-MM')
												if (!endTimeStr) return Promise.resolve()
												const startTimeStr = value.format('YYYY-MM')
												const compareRes = compareMonth(startTimeStr, endTimeStr)
												if (compareRes !== undefined && compareRes > 0) {
													return Promise.reject(new Error('不能超过结束日期'))
												}
												return Promise.resolve()
											}
										}
									]}
								>
									<DatePicker picker="month" format="YYYY-MM" className={styles.fullWidth} />
								</Form.Item>
							</Col>
							<Col xs={12} md={8}>
								<Form.Item className={styles.modalFormItem} name="endDate" label="结束日期">
									<DatePicker picker="month" format="YYYY-MM" className={styles.fullWidth} />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</Content>
		</Layout>
	)
}
