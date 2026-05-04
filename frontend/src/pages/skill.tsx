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
	Progress,
	Tooltip,
	InputNumber
} from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { DeleteOutlined, CodeOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import { getSkillConfig, writeSkillConfig } from '../services/skill'
import { throttle } from '../utils/util'
import styles from '../styles/pages/skill.module.scss'
import { Content } from 'antd/es/layout/layout'
import { Icon } from '@iconify/react'

const { useBreakpoint } = Grid

interface Skill {
	id: string
	name: string
	description: string
	icon: string
	category: 'frontend' | 'backend' | 'database' | 'tools' | 'other'
	level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
	experience: {
		years: number
		months: number
	}
	projects?: string[] // 关联项目,该字段废弃不用
	certifications?: string[]
	color?: string
}

const levelMap = {
	beginner: { label: '初级', color: 'green', percent: 25 },
	intermediate: { label: '中级', color: 'gold', percent: 50 },
	advanced: { label: '高级', color: 'volcano', percent: 75 },
	expert: { label: '专家', color: 'red', percent: 100 }
}

const categoryMap = {
	frontend: { label: '前端', color: 'geekblue' },
	backend: { label: '后端', color: 'purple' },
	database: { label: '数据库', color: 'green' },
	tools: { label: '工具', color: 'orange' },
	other: { label: '其他', color: 'magenta' }
}

export default function Skill() {
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [skillList, setSkillList] = useState<Skill[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const [pageList, setPageList] = useState<Skill[]>([])
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
		setPageList(skillList.slice((page - 1) * size, page * size) || [])
	}

	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getSkillConfig()
			if (res.success) {
				const data: Skill[] = res.data?.skillsData || []
				setSkillList(data)
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
				experienceYears: item.experience.years,
				experienceMonths: item.experience.months
			})
		} else {
			form.setFieldsValue({
				id: `skill-${Date.now()}`,
				category: 'frontend',
				level: 'beginner',
				experienceYears: 0,
				experienceMonths: 0,
				projects: [],
				certifications: []
			})
		}
		setIsModalOpen(true)
	}

	const updateList = useCallback(
		async (newList: Skill[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				const res = await writeSkillConfig({ skillsData: newList })
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
			const formattedValues: Skill = {
				id: values.id,
				name: values.name,
				description: values.description,
				icon: values.icon,
				category: values.category,
				level: values.level,
				experience: {
					years: values.experienceYears || 0,
					months: values.experienceMonths || 0
				},
				projects: [],
				certifications: values.certifications || [],
				color: values.color
			}

			const newList = [...skillList]
			if (editingIndex !== -1) {
				const realIndex = skillList.findIndex((item) => item.id === pageList[editingIndex].id)
				if (realIndex !== -1) newList[realIndex] = formattedValues
			} else {
				newList.unshift(formattedValues)
			}
			await updateList(newList, editingIndex === -1 ? '添加成功' : '修改成功', pageNum, pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [updateList, skillList, editingIndex, form, pageList, pageNum, pageSize])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	const removeSkills = async () => {
		const removeIds = new Set(pageList.filter((_, index) => checkedIdxes.has(index)).map((i) => i.id))
		const newList = skillList.filter((item) => !removeIds.has(item.id))
		const newTotalPages = Math.max(1, Math.ceil(newList.length / pageSize))
		const newPageNum = Math.min(pageNum, newTotalPages)
		await updateList(newList, '删除成功', newPageNum, pageSize)
	}

	const getExperienceText = (experience: { years: number; months: number }) => {
		const parts = []
		if (experience.years > 0) parts.push(`${experience.years}年`)
		if (experience.months > 0) parts.push(`${experience.months}个月`)
		return parts.length > 0 ? parts.join('') : '不足1个月'
	}

	useEffect(() => {
		getConfig(1, 12)
	}, [])

	return (
		<Layout className={styles['layout-container']}>
			<Content style={{ padding: screens.md ? '24px' : '8px', overflowY: 'auto' }}>
				<Spin spinning={loading}>
					<div className={styles.toolbar}>
						<div style={{ display: 'flex', flexDirection: 'column' }}>
							<Typography.Title level={4} style={{ margin: 0 }}>
								<CodeOutlined /> 技能管理
							</Typography.Title>
							<Typography.Text type="secondary">展示技术栈与技能水平</Typography.Text>
						</div>
					</div>

					<Space style={{ marginBottom: 16 }}>
						{pageList.length > 0 && (
							<Checkbox onChange={onCheckAllChange} indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length} checked={checkedIdxes.size === pageList.length}>
								全选
							</Checkbox>
						)}
						{checkedIdxes.size > 0 && (
							<Popconfirm title="确定删除选中的技能吗?" onConfirm={removeSkills} okText="确定" cancelText="取消">
								<Button danger icon={<DeleteOutlined />}>
									删除
								</Button>
							</Popconfirm>
						)}
						<Button icon={<PlusOutlined />} onClick={() => openEditModal(undefined, -1)}>
							添加技能
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
										style={{ borderTop: `4px solid ${item.color || '#1890ff'}` }}
										actions={[<EditOutlined key="edit" onClick={(e) => openEditModal(e, index)} />]}
									>
										<Checkbox style={{ position: 'absolute', right: 16, top: 16, zIndex: 1 }} checked={checkedIdxes.has(index)} onChange={(e) => onCheckChange(e, index)} />
										<div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
											{item.icon && (
												<div
													style={{
														width: 48,
														height: 48,
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														background: '#f5f5f5',
														borderRadius: 12,
														marginRight: 12
													}}
												>
													<Icon icon={item.icon} width={32} height={32} />
												</div>
											)}
											<div style={{ flex: 1 }}>
												<Typography.Title level={5} style={{ margin: 0 }}>
													{item.name}
												</Typography.Title>
												<Tag color={categoryMap[item.category]?.color} style={{ marginTop: 4 }}>
													{categoryMap[item.category]?.label}
												</Tag>
											</div>
										</div>

										<Typography.Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginBottom: 12, color: '#666' }}>
											{item.description}
										</Typography.Paragraph>

										<div style={{ marginBottom: 8 }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
												<span style={{ fontSize: 12 }}>经验</span>
												<Tooltip title={getExperienceText(item.experience)}>
													<span style={{ fontSize: 12, color: '#999' }}>{getExperienceText(item.experience)}</span>
												</Tooltip>
											</div>
											<Progress
												percent={levelMap[item.level]?.percent}
												size="small"
												strokeColor={item.color}
												format={() => (
													<Tag style={{ borderRadius: 12 }} color={levelMap[item.level]?.color}>
														{levelMap[item.level]?.label}
													</Tag>
												)}
											/>
										</div>
										<Space wrap size={[4, 0]}>
											{item.certifications?.map((tag) => (
												<Tag key={tag} color="green" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													#{tag}
												</Tag>
											))}
										</Space>
									</Card>
								</Col>
							))}
						</Row>
					) : (
						<Empty style={{ marginTop: 60 }} description="快来添加你的第一个技能~" />
					)}

					{skillList.length > 0 && (
						<Row justify="center" style={{ marginTop: 32 }}>
							<Pagination
								size="small"
								showQuickJumper
								showSizeChanger
								current={pageNum}
								pageSize={pageSize}
								total={skillList.length}
								onChange={onPageChange}
								pageSizeOptions={[12, 24, 48, 96]}
								style={{ margin: '30px auto', whiteSpace: 'nowrap' }}
							/>
						</Row>
					)}
				</Spin>

				<Modal
					title={editingIndex === -1 ? '新增技能' : '编辑技能'}
					open={isModalOpen}
					onOk={throttledSave}
					onCancel={() => setIsModalOpen(false)}
					width={600}
					okText="保存"
					cancelText="取消"
					centered
					mask={{ closable: false }}
					destroyOnHidden
				>
					<Form form={form} layout="vertical" initialValues={{ category: 'frontend', level: 'beginner', experienceYears: 0, experienceMonths: 0, color: '#1890ff' }}>
						<Form.Item name="id" hidden>
							<Input />
						</Form.Item>
						<Row gutter={16}>
							<Col xs={24} md={12}>
								<Form.Item name="name" label="技能名称" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Input placeholder="输入技能名称, 如: React" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="category" label="技能分类" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Select
										options={[
											{ label: '前端开发', value: 'frontend' },
											{ label: '后端开发', value: 'backend' },
											{ label: '数据库', value: 'database' },
											{ label: '开发工具', value: 'tools' },
											{ label: '其他', value: 'other' }
										]}
									/>
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="level" label="技能等级" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Select
										options={[
											{ label: '初级', value: 'beginner' },
											{ label: '中级', value: 'intermediate' },
											{ label: '高级', value: 'advanced' },
											{ label: '专家', value: 'expert' }
										]}
									/>
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="color" label="主题颜色" style={{ marginBottom: 8 }}>
									<Input type="color" placeholder="#1890ff" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="description" label="技能描述" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
									<Input.TextArea rows={3} placeholder="描述应用场景和技术亮点..." />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item
									name="icon"
									label={
										<>
											<span>图标(仅部分支持)</span>
											<a href="https://icon-sets.iconify.design/" target="_blank">
												&nbsp;访问 Iconify
											</a>
										</>
									}
									rules={[{ required: true }]}
									style={{ marginBottom: 8 }}
								>
									<Input placeholder="例如: logos:javascript" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : <span />} />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="experienceYears" label="经验年限" style={{ marginBottom: 8 }} rules={[{ required: true }]}>
									<InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="输入经验年限" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="experienceMonths" label="经验月数" style={{ marginBottom: 8 }} rules={[{ required: true }]}>
									<InputNumber min={0} max={11} style={{ width: '100%' }} placeholder="输入经验月数" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="certifications" label="奖项证书" style={{ marginBottom: 8 }}>
									<Select mode="tags" placeholder="输入竞赛奖项或证书名称" />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</Content>
		</Layout>
	)
}
