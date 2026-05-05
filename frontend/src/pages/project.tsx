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
	Upload,
	Image
} from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { EditOutlined, DeleteOutlined, ProjectOutlined, GithubOutlined, CodeOutlined, RocketOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getProjectConfig, writeProjectConfig, uploadProjectImages } from '../services/project'
import { throttle } from '../utils/util'
import styles from '../styles/pages/friend.module.scss'
import { Content } from 'antd/es/layout/layout'
import { imageAccept } from '../configs/uploadConfig'

const { useBreakpoint } = Grid

interface Project {
	id: string
	title: string
	description: string
	image: string
	category: 'web' | 'mobile' | 'desktop' | 'other'
	techStack: string[]
	status: 'completed' | 'in-progress' | 'planned'
	liveDemo?: string
	sourceCode?: string
	startDate: string
	endDate?: string
	featured?: boolean
	tags?: string[]
	visitUrl?: string
}

export default function Project() {
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [projectList, setProjectList] = useState<Project[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const [pageList, setPageList] = useState<Project[]>([])
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [checkedIdxes, setCheckedIdxes] = useState<Set<number>>(new Set())

	const imageUrlValue = Form.useWatch('image', form)

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
		setPageList(projectList.slice((page - 1) * size, page * size) || [])
	}

	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getProjectConfig()
			if (res.success) {
				const data: Project[] = res.data?.projectsData || []
				setProjectList(data)
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
			const item = pageList[index]
			form.setFieldsValue({
				...item,
				startDate: item.startDate ? dayjs(item.startDate) : null,
				endDate: item.endDate ? dayjs(item.endDate) : null
			})
		} else {
			form.setFieldsValue({
				id: `project-${Date.now()}`,
				techStack: [],
				tags: [],
				status: 'planned',
				category: 'web',
				featured: false
			})
		}
		setIsModalOpen(true)
	}

	const updateList = useCallback(
		async (newList: Project[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				const res = await writeProjectConfig({ projectsData: newList })
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

	const handleUpload = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadProjectImages([file])
			if (res.success) {
				message.success('上传成功')
				form.setFieldsValue({ image: res.data?.[0]?.publicPath || '' })
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
			// 处理日期
			const formattedValues = {
				...values,
				liveDemo: values.visitUrl, // 预览地址和在线演示地址用同一个
				startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
				endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : ''
			}

			const newList = [...projectList]
			if (editingIndex !== -1) {
				const realIndex = projectList.findIndex((item) => item.id === pageList[editingIndex].id)
				if (realIndex !== -1) newList[realIndex] = formattedValues
			} else {
				newList.unshift(formattedValues)
			}
			await updateList(newList, editingIndex === -1 ? '添加成功' : '修改成功', pageNum, pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [updateList, projectList, editingIndex, form, pageList, pageNum, pageSize])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	const removeProjects = async () => {
		const removeIds = new Set(pageList.filter((_, index) => checkedIdxes.has(index)).map((i) => i.id))
		const newList = projectList.filter((item) => !removeIds.has(item.id))
		const newTotalPages = Math.max(1, Math.ceil(newList.length / pageSize))
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
								<ProjectOutlined /> 项目管理
							</Typography.Title>
							<Typography.Text type="secondary">展示项目作品集</Typography.Text>
						</div>
					</div>

					<Space style={{ marginBottom: 16 }}>
						{pageList.length > 0 && (
							<Checkbox onChange={onCheckAllChange} indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length} checked={checkedIdxes.size === pageList.length}>
								全选
							</Checkbox>
						)}
						{checkedIdxes.size > 0 && (
							<Popconfirm title="确定删除选中的项目吗?" onConfirm={removeProjects} okText="确定" cancelText="取消">
								<Button loading={loading} danger icon={<DeleteOutlined />}>
									删除
								</Button>
							</Popconfirm>
						)}
						<Button loading={loading} icon={<EditOutlined />} onClick={() => openEditModal(undefined, -1)}>
							新增项目
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
												{item.image ? (
													<img loading="lazy" alt={item.title} src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
												) : (
													<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
														<ProjectOutlined style={{ fontSize: 40, color: '#ccc' }} />
													</div>
												)}
												{item.featured && (
													<Tag color="blue" variant="solid" style={{ position: 'absolute', top: 8, left: 8 }}>
														精选
													</Tag>
												)}
											</div>
										}
										actions={[
											<EditOutlined key="edit" onClick={(e) => openEditModal(e, index)} />,
											<a key="link" href={item.sourceCode} target="_blank" onClick={(e) => e.stopPropagation()}>
												<GithubOutlined />
											</a>,
											<a key="link" href={item.visitUrl || item.liveDemo} target="_blank" onClick={(e) => e.stopPropagation()}>
												<RocketOutlined />
											</a>
										]}
									>
										<Checkbox style={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }} checked={checkedIdxes.has(index)} onChange={(e) => onCheckChange(e, index)} />
										<Card.Meta
											title={item.title}
											description={
												<Typography.Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, height: 40, marginBottom: 8 }}>
													{item.description}
												</Typography.Paragraph>
											}
										/>
										<Space wrap size={[4, 0]} style={{ marginTop: 8 }}>
											<Tag
												color={item.status === 'completed' ? 'green' : item.status === 'in-progress' ? 'gold' : 'default'}
												style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
											>
												{item.status === 'completed' ? '已完成' : item.status === 'in-progress' ? '进行中' : '计划中'}
											</Tag>
											{item.techStack?.map((tech) => (
												<Tag key={tech} color="geekblue" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													{tech}
												</Tag>
											))}
										</Space>
										<Space wrap size={[4, 0]}>
											{item.tags?.map((tag) => (
												<Tag key={tag} color="purple" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													#{tag}
												</Tag>
											))}
										</Space>
									</Card>
								</Col>
							))}
						</Row>
					) : (
						<Empty style={{ marginTop: 60 }} description="快来发布你的第一个项目~" />
					)}

					{projectList.length > 0 && (
						<Row justify="center" style={{ marginTop: 32 }}>
							<Pagination
								size="small"
								showQuickJumper
								showSizeChanger
								current={pageNum}
								pageSize={pageSize}
								total={projectList.length}
								onChange={onPageChange}
								pageSizeOptions={[12, 24, 48, 96]}
								style={{ margin: '30px auto', whiteSpace: 'nowrap' }}
							/>
						</Row>
					)}
				</Spin>

				<Modal
					title={editingIndex === -1 ? '新增项目' : '修改项目'}
					open={isModalOpen}
					onOk={throttledSave}
					onCancel={() => setIsModalOpen(false)}
					width={800}
					okText="保存"
					cancelText="取消"
					centered
					mask={{ closable: false }}
					destroyOnHidden
				>
					<Form form={form} layout="vertical" initialValues={{ featured: false }}>
						<Form.Item name="id" hidden>
							<Input />
						</Form.Item>
						<Row gutter={16}>
							<Col xs={24} md={12}>
								<Form.Item name="title" label="项目名称" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Input placeholder="例如：Mizuki Blog" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="category" label="分类" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Select
										options={[
											{ label: '网页应用', value: 'web' },
											{ label: '移动应用', value: 'mobile' },
											{ label: '桌面应用', value: 'desktop' },
											{ label: 'Other 其他', value: 'other' }
										]}
									></Select>
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="description" label="项目描述" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Input.TextArea rows={3} placeholder="简单介绍一下这个项目..." />
								</Form.Item>
							</Col>
							<Col span={24}>
								<div style={{ display: 'flex', flexDirection: screens.md ? 'row' : 'column', gap: screens.md ? 8 : 0, overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
									<Form.Item style={{ flex: 1, marginBottom: 8 }} name="image" label="设备图片" rules={[{ required: true }]}>
										<Space.Compact style={{ width: '100%' }}>
											<Form.Item name="image" noStyle>
												<Input placeholder="输入图片外链" />
											</Form.Item>
											<Upload showUploadList={false} beforeUpload={handleUpload} accept={imageAccept}>
												<Button loading={loading} icon={<UploadOutlined />}>
													上传
												</Button>
											</Upload>
										</Space.Compact>
									</Form.Item>
									{imageUrlValue && <Image loading="lazy" width={screens.md ? 70 : '100%'} height={70} src={imageUrlValue} style={{ objectFit: 'contain' }} />}
								</div>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="status" label="项目状态" style={{ marginBottom: 8 }}>
									<Select
										options={[
											{ label: '已完成', value: 'completed' },
											{ label: '进行中', value: 'in-progress' },
											{ label: '计划中', value: 'planned' }
										]}
									/>
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="visitUrl" label="预览地址" style={{ marginBottom: 8 }}>
									<Input prefix={<RocketOutlined />} placeholder="输入预览地址" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="sourceCode" label="源码地址" style={{ marginBottom: 8 }}>
									<Input prefix={<GithubOutlined />} placeholder="GitHub Repo URL" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="startDate" label="开始日期" style={{ marginBottom: 8 }} rules={[{ required: true }]}>
									<DatePicker style={{ width: '100%' }} />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="endDate" label="结束日期" style={{ marginBottom: 8 }}>
									<DatePicker style={{ width: '100%' }} />
								</Form.Item>
							</Col>
							<Col xs={24} md={6}>
								<Form.Item name="featured" label="是否精选" valuePropName="checked" style={{ marginBottom: 8 }}>
									<Switch />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="techStack" label="技术栈" style={{ marginBottom: 8 }}>
									<Select mode="tags" prefix={<CodeOutlined />} placeholder="添加技术栈, 如: React" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="tags" label="标签" style={{ marginBottom: 8 }}>
									<Select mode="tags" placeholder="添加项目标签" />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</Content>
		</Layout>
	)
}
