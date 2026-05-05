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
	Select,
	DatePicker,
	Switch,
	Timeline as AntTimeline
} from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { DeleteOutlined, ClockCircleOutlined, PlusOutlined, EditOutlined, LinkOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons'
import { getTimelineConfig, writeTimelineConfig } from '../services/timeline'
import { throttle } from '../utils/util'
import styles from '../styles/pages/timeline.module.scss'
import { Content } from 'antd/es/layout/layout'
import { Icon } from '@iconify/react'
import dayjs from 'dayjs'

interface TimelineItem {
	id: string
	title: string
	description: string
	type: 'education' | 'work' | 'project' | 'achievement'
	startDate: string
	endDate?: string
	location?: string
	organization?: string
	position?: string
	skills?: string[]
	achievements?: string[]
	links?: {
		name: string
		url: string
		type: 'website' | 'certificate' | 'project' | 'other'
	}[]
	icon?: string
	color?: string
	featured?: boolean
}

const { useBreakpoint } = Grid
const { TextArea } = Input

const typeMap = {
	education: { label: '教育经历', color: 'geekblue', icon: <ClockCircleOutlined /> },
	work: { label: '工作经历', color: 'green', icon: <ClockCircleOutlined /> },
	project: { label: '项目经历', color: 'purple', icon: <ClockCircleOutlined /> },
	achievement: { label: '成就荣誉', color: 'volcano', icon: <ClockCircleOutlined /> }
}

export default function Timeline() {
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [timelineList, setTimelineList] = useState<TimelineItem[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const [pageList, setPageList] = useState<TimelineItem[]>([])
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [checkedIdxes, setCheckedIdxes] = useState<Set<number>>(new Set())

	const iconValue = Form.useWatch('icon', form)

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
		setPageList(timelineList.slice((page - 1) * size, page * size) || [])
	}

	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getTimelineConfig()
			if (res.success) {
				const data: TimelineItem[] = res.data?.timelineData || []
				// 按最新时间倒序
				const sortedData = [...data].sort((a, b) => {
					// 进行中的排前面
					if (!a.endDate && b.endDate) return -1
					if (a.endDate && !b.endDate) return 1
					return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
				})
				setTimelineList(sortedData)
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
			const item = pageList[index]
			form.setFieldsValue({
				...item,
				startDate: item.startDate ? dayjs(item.startDate) : null,
				endDate: item.endDate ? dayjs(item.endDate) : null,
				links: item.links || []
			})
		} else {
			form.setFieldsValue({
				id: `timeline-${Date.now()}`,
				type: 'education',
				skills: [],
				achievements: [],
				links: [],
				featured: false
			})
		}
		setIsModalOpen(true)
	}

	const updateList = useCallback(
		async (newList: TimelineItem[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				const res = await writeTimelineConfig({ timelineData: newList })
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
			const formattedValues: TimelineItem = {
				id: values.id,
				title: values.title,
				description: values.description,
				type: values.type,
				startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
				endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : '',
				location: values.location,
				organization: values.organization,
				position: values.position,
				skills: values.skills || [],
				achievements: values.achievements || [],
				links: values.links || [],
				icon: values.icon,
				color: values.color,
				featured: values.featured || false
			}

			const newList = [...timelineList]
			if (editingIndex !== -1) {
				const realIndex = timelineList.findIndex((item) => item.id === pageList[editingIndex].id)
				if (realIndex !== -1) newList[realIndex] = formattedValues
			} else {
				newList.unshift(formattedValues)
			}
			await updateList(newList, editingIndex === -1 ? '添加成功' : '修改成功', pageNum, pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [updateList, timelineList, editingIndex, form, pageList, pageNum, pageSize])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	const removeTimelineItems = async () => {
		const removeIds = new Set(pageList.filter((_, index) => checkedIdxes.has(index)).map((i) => i.id))
		const newList = timelineList.filter((item) => !removeIds.has(item.id))
		const newTotalPages = Math.max(1, Math.ceil(newList.length / pageSize))
		const newPageNum = Math.min(pageNum, newTotalPages)
		await updateList(newList, '删除成功', newPageNum, pageSize)
	}

	const formatDate = (date: string) => {
		if (!date) return ''
		return dayjs(date).format('YYYY年MM月')
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
								<ClockCircleOutlined /> 时间线管理
							</Typography.Title>
							<Typography.Text type="secondary">管理成长历程和重要里程碑</Typography.Text>
						</div>
					</div>

					<Space style={{ marginBottom: 16 }}>
						{pageList.length > 0 && (
							<Checkbox onChange={onCheckAllChange} indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length} checked={checkedIdxes.size === pageList.length}>
								全选
							</Checkbox>
						)}
						{checkedIdxes.size > 0 && (
							<Popconfirm title="确定删除选中的时间线条目吗?" onConfirm={removeTimelineItems} okText="确定" cancelText="取消">
								<Button loading={loading} danger icon={<DeleteOutlined />}>
									删除
								</Button>
							</Popconfirm>
						)}
						<Button loading={loading} icon={<PlusOutlined />} onClick={() => openEditModal(undefined, -1)}>
							添加条目
						</Button>
					</Space>

					{pageList.length > 0 ? (
						<AntTimeline
							items={pageList.map((item, index) => ({
								key: item.id,
								color: item.color || typeMap[item.type]?.color,
								icon: item.icon ? <Icon icon={item.icon} width={20} height={20} /> : null,
								content: (
									<Card
										hoverable
										size="small"
										onClick={() => _handleCheck(!checkedIdxes.has(index), index)}
										style={{ marginBottom: 16, borderLeft: `4px solid ${item.color || typeMap[item.type]?.color || '#1890ff'}` }}
										actions={[<EditOutlined key="edit" onClick={(e) => openEditModal(e, index)} />]}
									>
										<Checkbox style={{ position: 'absolute', right: 16, top: 16, zIndex: 1 }} checked={checkedIdxes.has(index)} onChange={(e) => onCheckChange(e, index)} />

										<div style={{ marginBottom: 12 }}>
											<Space wrap>
												{item.featured && (
													<Tag style={{ borderRadius: 12 }} color="gold">
														精选
													</Tag>
												)}
												{!item.endDate && (
													<Tag style={{ borderRadius: 12 }} color="green">
														当前状态
													</Tag>
												)}
												<Tag style={{ borderRadius: 12 }} color={typeMap[item.type]?.color}>
													{typeMap[item.type]?.label}
												</Tag>
											</Space>
										</div>

										<Typography.Title level={5} style={{ marginBottom: 4 }}>
											{item.title}
										</Typography.Title>

										<div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
											{item.organization && (
												<Space size={4}>
													<TeamOutlined />
													<Typography.Text type="secondary" style={{ fontSize: 12 }}>
														{item.organization}
													</Typography.Text>
												</Space>
											)}
											{item.location && (
												<Space size={4}>
													<EnvironmentOutlined />
													<Typography.Text type="secondary" style={{ fontSize: 12 }}>
														{item.location}
													</Typography.Text>
												</Space>
											)}
											{item.position && (
												<Typography.Text type="secondary" style={{ fontSize: 12 }}>
													{item.position}
												</Typography.Text>
											)}
										</div>

										<Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
											{formatDate(item.startDate)} - {item.endDate ? formatDate(item.endDate) : '至今'}
										</Typography.Text>

										<Typography.Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginBottom: 8, color: '#666' }}>
											{item.description}
										</Typography.Paragraph>

										<div style={{ marginBottom: 4 }}>
											{item.achievements && item.achievements.length > 0 && (
												<div style={{ display: 'flex', flexDirection: 'column' }}>
													<span style={{ fontSize: 12 }}>成就荣誉</span>
													<Space wrap size={[4, 0]}>
														{item.achievements?.map((achieve) => (
															<Tag key={achieve} color="default" style={{ fontSize: 10, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
																<span style={{ fontSize: 8, color: '#00c00a' }}>●</span> {achieve}
															</Tag>
														))}
													</Space>
												</div>
											)}
										</div>
										<div style={{ marginBottom: 4 }}>
											{item.skills && item.skills.length > 0 && (
												<Space wrap size={[4, 0]}>
													{item.skills?.map((skill) => (
														<Tag key={skill} color="blue" style={{ fontSize: 10, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
															{skill}
														</Tag>
													))}
												</Space>
											)}
										</div>
										<div>
											{item.links && item.links.length > 0 && (
												<Space wrap size={[4, 0]}>
													{item.links?.map((link, idx) => (
														<a key={idx} href={link.url} target="_blank" onClick={(e) => e.stopPropagation()}>
															<Tag color="geekblue" style={{ fontSize: 10, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
																<LinkOutlined /> {link.name}
															</Tag>
														</a>
													))}
												</Space>
											)}
										</div>
									</Card>
								)
							}))}
						/>
					) : (
						<Empty style={{ marginTop: 60 }} description="快来添加你的第一段经历~" />
					)}

					{timelineList.length > 0 && (
						<Row justify="center" style={{ marginTop: 32 }}>
							<Pagination
								size="small"
								showQuickJumper
								showSizeChanger
								current={pageNum}
								pageSize={pageSize}
								total={timelineList.length}
								onChange={onPageChange}
								pageSizeOptions={[12, 24]}
								style={{ margin: '30px auto', whiteSpace: 'nowrap' }}
							/>
						</Row>
					)}
				</Spin>

				<Modal
					title={editingIndex === -1 ? '添加时间线条目' : '编辑时间线条目'}
					open={isModalOpen}
					onOk={throttledSave}
					onCancel={() => setIsModalOpen(false)}
					width={700}
					okText="保存"
					cancelText="取消"
					centered
					mask={{ closable: false }}
					destroyOnHidden
				>
					<Form form={form} layout="vertical" initialValues={{ type: 'education', featured: false, color: '#1890ff' }}>
						<Form.Item name="id" hidden>
							<Input />
						</Form.Item>
						<Row gutter={[8, 0]}>
							<Col xs={24} md={14}>
								<Form.Item name="title" label="标题" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Input placeholder="输入标题" />
								</Form.Item>
							</Col>
							<Col xs={24} md={6}>
								<Form.Item name="type" label="类型" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Select
										options={[
											{ label: '教育经历', value: 'education' },
											{ label: '工作经历', value: 'work' },
											{ label: '项目经历', value: 'project' },
											{ label: '成就荣誉', value: 'achievement' }
										]}
									/>
								</Form.Item>
							</Col>
							<Col xs={24} md={4}>
								<Form.Item name="featured" label="是否精选" valuePropName="checked" style={{ marginBottom: 8 }}>
									<Switch />
								</Form.Item>
							</Col>
							<Col xs={24} md={14}>
								<Form.Item name="organization" label="组织/机构" style={{ marginBottom: 8 }}>
									<Input placeholder="例如: 某大学/某公司" />
								</Form.Item>
							</Col>
							<Col xs={24} md={6}>
								<Form.Item name="location" label="地点" style={{ marginBottom: 8 }}>
									<Input placeholder="例如: 北京/上海" />
								</Form.Item>
							</Col>
							<Col xs={24} md={4}>
								<Form.Item name="color" label="主题颜色" style={{ marginBottom: 8 }}>
									<Input type="color" style={{ width: '100%' }} />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="startDate" label="开始日期" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<DatePicker style={{ width: '100%' }} placeholder="选择开始日期" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="endDate" label="结束日期" style={{ marginBottom: 8 }}>
									<DatePicker style={{ width: '100%' }} placeholder="留空表示至今" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="position" label="职位/角色" style={{ marginBottom: 8 }}>
									<Input placeholder="例如: 前端开发实习生" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item
									name="icon"
									label={
										<>
											<span>图标(仅部分支持)</span>
											<a href="https://icon-sets.iconify.design/" target="_blank">
												&nbsp;访问Iconify
											</a>
										</>
									}
									style={{ marginBottom: 8 }}
								>
									<Form.Item name="icon" noStyle>
										<Input placeholder="例如: material-symbols:school" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : <span />} />
									</Form.Item>
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="description" label="描述" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<TextArea rows={3} placeholder="详细描述这段经历..." />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="achievements" label="成就荣誉" style={{ marginBottom: 8 }}>
									<Select mode="tags" placeholder="添加这段经历的收获和成就" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="skills" label="技术栈" style={{ marginBottom: 8 }}>
									<Select mode="tags" placeholder="添加相关技术栈, 如: React" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<div style={{ marginBottom: 8 }}>相关链接</div>
								<Form.List name="links">
									{(fields, { add, remove }) => (
										<>
											{fields.map((field) => (
												<div key={field.key} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
													<Form.Item key={`name-${field.key}`} name={[field.name, 'name']} rules={[{ required: true, message: '请输入名称' }]} style={{ marginBottom: 0 }}>
														<Input placeholder="名称" />
													</Form.Item>
													<Form.Item key={`url-${field.key}`} name={[field.name, 'url']} rules={[{ required: true, message: '请输入链接地址' }]} style={{ marginBottom: 0, flex: 1 }}>
														<Input placeholder="链接地址" />
													</Form.Item>
													<Form.Item
														key={`type-${field.key}`}
														name={[field.name, 'type']}
														rules={[{ required: true, message: '请选择类型' }]}
														style={{ marginBottom: 0, width: 100 }}
														initialValue="other"
													>
														<Select
															options={[
																{ label: '网站', value: 'website' },
																{ label: '证书', value: 'certificate' },
																{ label: '项目', value: 'project' },
																{ label: '其他', value: 'other' }
															]}
														/>
													</Form.Item>
													<Button loading={loading} icon={<DeleteOutlined />} onClick={() => remove(field.name)} danger size="small" />
												</div>
											))}
											<Button loading={loading} type="dashed" onClick={() => add({ type: 'other' })} block icon={<PlusOutlined />}>
												添加链接
											</Button>
										</>
									)}
								</Form.List>
							</Col>
						</Row>
					</Form>
				</Modal>
			</Content>
		</Layout>
	)
}
