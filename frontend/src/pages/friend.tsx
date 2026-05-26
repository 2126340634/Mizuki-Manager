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
	Avatar,
	Select
} from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { EditOutlined, DeleteOutlined, TeamOutlined, LinkOutlined, UserOutlined } from '@ant-design/icons'
import { getFriendConfig, writeFriendConfig } from '../services/friend'
import { throttle } from '../utils/util'
import styles from '../styles/pages/friend.module.scss'
import { Content } from 'antd/es/layout/layout'

const { useBreakpoint } = Grid

export interface FriendItem {
	id: number
	title: string
	imgurl: string
	desc: string
	siteurl: string
	tags: string[]
}

export default function Friend() {
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [friendList, setFriendList] = useState<FriendItem[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const [pageList, setPageList] = useState<FriendItem[]>([])
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [checkedIdxes, setCheckedIdxes] = useState<Set<number>>(new Set())

	const imgUrlValue = Form.useWatch('imgurl', form)

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
		setPageList(friendList.slice((page - 1) * size, page * size) || [])
	}

	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getFriendConfig()
			if (res.success) {
				const data: FriendItem[] = res.data?.friendsData || []
				setFriendList(data)
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
			form.setFieldsValue({ ...item })
		} else {
			form.setFieldsValue({ id: Date.now(), tags: [] })
		}
		setIsModalOpen(true)
	}

	const updateList = useCallback(
		async (newList: FriendItem[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				const res = await writeFriendConfig({ friendsData: newList })
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
			const newList = [...friendList]
			if (editingIndex !== -1) {
				const realIndex = friendList.findIndex((item) => item.id === pageList[editingIndex].id)
				if (realIndex !== -1) newList[realIndex] = values
			} else {
				newList.unshift(values)
			}
			await updateList(newList, editingIndex === -1 ? '添加成功' : '修改成功', pageNum, pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [updateList, friendList, editingIndex, form, pageList, pageNum, pageSize])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	const removeFriends = async () => {
		const removeIds = new Set(pageList.filter((_, index) => checkedIdxes.has(index)).map((i) => i.id))
		const newList = friendList.filter((item) => !removeIds.has(item.id))
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
					<div className={styles.toolbar}>
						<div className={styles.toolbarTitle}>
							<Typography.Title level={4} className={styles.pageTitle}>
								<TeamOutlined /> 友链管理
							</Typography.Title>
							<Typography.Text type="secondary">发现更多优质网站</Typography.Text>
						</div>
					</div>

					<Space>
						{pageList.length > 0 && (
							<Checkbox onChange={onCheckAllChange} indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length} checked={checkedIdxes.size === pageList.length}>
								全选
							</Checkbox>
						)}
						{checkedIdxes.size > 0 && (
							<Popconfirm title="确定删除选中的友链吗?" onConfirm={removeFriends} okText="确定" cancelText="取消">
								<Button loading={loading} icon={<DeleteOutlined />}>
									删除
								</Button>
							</Popconfirm>
						)}
						<Button loading={loading} icon={<EditOutlined />} onClick={() => openEditModal(undefined, -1)}>
							新增友链
						</Button>
					</Space>

					{pageList.length > 0 ? (
						<Row gutter={[8, 8]} className={styles.friendListRow}>
							{pageList.map((item, index) => (
								<Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
									<Card
										className={styles.card}
										hoverable
										size="small"
										onClick={() => _handleCheck(!checkedIdxes.has(index), index)}
										actions={[<EditOutlined key="edit" onClick={(e) => openEditModal(e, index)} />]}
									>
										<div className={styles.cardContent}>
											<Checkbox className={styles.cardCheckbox} checked={checkedIdxes.has(index)} onChange={(e) => onCheckChange(e, index)} />
											<Space align="start" className={styles.friendHeader}>
												<Avatar src={item.imgurl} size={48} icon={<UserOutlined />} />
												<div>
													<Typography.Text strong className={styles.friendTitle}>
														{item.title}
													</Typography.Text>
													<br />
													<Typography.Link href={item.siteurl} target="_blank" onClick={(e) => e.stopPropagation()}>
														<LinkOutlined /> 访问站点
													</Typography.Link>
												</div>
											</Space>

											<Typography.Paragraph ellipsis={{ rows: 2 }} className={styles.friendDesc}>
												{item.desc}
											</Typography.Paragraph>

											{item.tags && item.tags.length > 0 && (
												<Space wrap className={styles.tagSpace}>
													{item.tags.map((tag: string) => (
														<Tag key={tag} color="blue" className={styles.tag}>
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
						<Empty className={styles.empty} description="目前还没有友链哦" />
					)}

					{friendList.length > 0 && (
						<Row>
							<Pagination
								size="small"
								showQuickJumper
								showSizeChanger
								current={pageNum}
								pageSize={pageSize}
								total={friendList.length}
								onChange={onPageChange}
								pageSizeOptions={[12, 24, 48, 96]}
								className={styles.pagination}
							/>
						</Row>
					)}
				</Spin>

				<Modal
					title={editingIndex === -1 ? '新增友链' : '修改友链'}
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
								<Form.Item name="title" label="站点名称" rules={[{ required: true }]} className={styles.modalFormItem}>
									<Input placeholder="输入站点名称" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item name="siteurl" label="站点链接" rules={[{ required: true }]} className={styles.modalFormItem}>
									<Input prefix={<LinkOutlined />} placeholder="输入站点提供的链接" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<div className={styles.modalImageWrapper}>
									<Form.Item name="imgurl" label="图标链接" rules={[{ required: true }]} className={styles.modalFormItem}>
										<Space.Compact className={styles.fullWidth}>
											<Input value={imgUrlValue} placeholder="请输入站点提供的图标外链" onChange={(e) => form.setFieldsValue({ imgurl: e.target.value })} />
										</Space.Compact>
									</Form.Item>
									{imgUrlValue && <Avatar shape="square" src={imgUrlValue} className={styles.modalAvatar} />}
								</div>
							</Col>
							<Col span={24}>
								<Form.Item name="desc" label="站点描述" rules={[{ required: true }]} className={styles.modalFormItem}>
									<Input.TextArea placeholder="简单介绍一下对方..." rows={3} />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="tags" label="标签" className={styles.modalFormItem}>
									<Select mode="tags" placeholder="添加标签" className={styles.fullWidth} />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</Content>
		</Layout>
	)
}
