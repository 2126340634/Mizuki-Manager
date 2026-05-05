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
	CheckboxChangeEvent
} from 'antd'
import { EditOutlined, UploadOutlined, LinkOutlined, DeleteOutlined, BoxPlotOutlined } from '@ant-design/icons'
import { getDeviceConfig, writeDeviceConfig, uploadDeviceImages } from '../services/device'
import { throttle } from '../utils/util'
import styles from '../styles/pages/device.module.scss'
import { Content } from 'antd/es/layout/layout'
import { imageAccept } from '../configs/uploadConfig'

const { useBreakpoint } = Grid

interface DeviceItem {
	name: string
	image: string
	specs: string
	description: string
	link: string
	category?: string // 所属分类,默认为Other
}

interface DeviceData {
	devicesData: Record<string, DeviceItem[]>
}

const DEFAULT_CATEGORY = 'Other' // 默认分类

export default function Device() {
	const screens = useBreakpoint()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [deviceList, setDeviceList] = useState<DeviceItem[]>([]) // 扁平化总列表
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number>()
	const [pageList, setPageList] = useState<DeviceItem[]>([])
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [checkedIdxes, setCheckedIdxes] = useState<Set<number>>(new Set())

	const imageValue = Form.useWatch('image', form)

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

	const toggleCheck = (index: number) => {
		const needCheck = !checkedIdxes.has(index)
		_handleCheck(needCheck, index)
	}

	const onPageChange = async (page: number, size: number) => {
		setCheckedIdxes(new Set())
		setPageNum(page)
		setPageSize(size)
		setPageList(deviceList.slice((page - 1) * size, page * size) || [])
	}

	const getConfig = useCallback(async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getDeviceConfig()
			if (res.success) {
				const rawData = (res.data as DeviceData)?.devicesData || {}
				const flatData: DeviceItem[] = Object.keys(rawData).flatMap((cat) => rawData[cat].map((item) => ({ ...item, category: cat })))
				setDeviceList(flatData)
				setPageList(flatData.slice((num - 1) * size, num * size) || [])
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
			// 修改回显数据
			form.setFieldsValue(pageList[index])
		}
		setIsModalOpen(true)
	}

	const updateList = useCallback(
		async (newList: DeviceItem[], successMsg: string, num: number, size: number) => {
			try {
				setLoading(true)
				let devicesData: Record<string, DeviceItem[]> = {}
				// 恢复原结构 [ { [category]: { [name]:xxx, [xxx]:xxx } } ]
				newList.forEach((item) => {
					const cat = item.category || DEFAULT_CATEGORY
					if (!devicesData[cat]) devicesData[cat] = []
					const { category, ...data } = item
					devicesData[cat].push(data as DeviceItem)
				})
				// 默认分类放最后一个
				if (DEFAULT_CATEGORY in devicesData) {
					const { [DEFAULT_CATEGORY]: defaultCat, ...others } = devicesData
					devicesData = { ...others, [DEFAULT_CATEGORY]: defaultCat }
				}
				const res = await writeDeviceConfig({ devicesData })
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
			const newList = [...deviceList]
			if (editingIndex !== -1) {
				const realIndex = deviceList.findIndex((item) => item === pageList[editingIndex])
				// 不改变原有设备位置顺序
				if (realIndex !== -1) newList[realIndex] = values
			} else {
				newList.unshift(values)
			}
			await updateList(newList, editingIndex === -1 ? '添加成功' : '修改成功', pageNum, pageSize)
		} catch (err) {
			console.error(err)
		}
	}, [updateList, deviceList, editingIndex, form, pageList, pageNum, pageSize])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	const uploadCover = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadDeviceImages([file])
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

	const removeDevice = async () => {
		const removeItems = new Set(pageList.filter((_, index) => checkedIdxes.has(index)))
		const newList = deviceList.filter((item) => !removeItems.has(item))
		// 删除后的分页总数
		const newTotalPages = Math.max(1, Math.ceil(newList.length / pageSize))
		// 计算删除后应该更新的pageNum值
		const newPageNum = Math.min(pageNum, newTotalPages)
		await updateList(newList, '删除成功', newPageNum, pageSize)
	}

	// 初始化
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
								<BoxPlotOutlined /> 设备清单
							</Typography.Title>
							<Typography.Text type="secondary">管理数码设备</Typography.Text>
						</div>
					</div>

					<Space>
						{pageList.length > 0 && (
							<Checkbox onChange={onCheckAllChange} indeterminate={checkedIdxes.size > 0 && checkedIdxes.size < pageList.length} checked={checkedIdxes.size === pageList.length}>
								全选
							</Checkbox>
						)}
						{checkedIdxes.size > 0 && (
							<Popconfirm title="确定删除?" onConfirm={removeDevice} okText="确定" cancelText="取消">
								<Button loading={loading} icon={<DeleteOutlined />}>
									删除
								</Button>
							</Popconfirm>
						)}
						<Button loading={loading} icon={<EditOutlined />} onClick={() => openEditModal(undefined, -1)}>
							添加设备
						</Button>
					</Space>

					{pageList.length > 0 ? (
						<Row gutter={[4, 4]} className={styles.deviceListRow}>
							{pageList.map((item, index) => (
								<Col key={index} xs={12} sm={8} md={12} lg={6}>
									<Card
										hoverable
										size="small"
										cover={
											<div className={styles.cover} onClick={(e) => e.stopPropagation()}>
												{item.image && <Image loading="lazy" height="100%" width="100%" className={styles.coverImage} src={item.image} />}
												<Tag color="black" className={styles.tag}>
													{item.category}
												</Tag>
												<Checkbox className={styles.coverCheckbox} style={{ opacity: checkedIdxes.has(index) ? 1 : 0.4 }} checked={checkedIdxes.has(index)} onChange={(e) => onCheckChange(e, index)} />
											</div>
										}
										actions={[
											<a href={item.link} target="_blank" onClick={(e) => e.stopPropagation()}>
												<LinkOutlined />
											</a>,
											<EditOutlined onClick={(e) => openEditModal(e, index)} />
										]}
										onClick={() => toggleCheck(index)}
									>
										<Card.Meta
											title={
												<Typography.Text ellipsis={{ tooltip: item.name }} className={styles.deviceName}>
													{item.name}
												</Typography.Text>
											}
											description={
												<Space orientation="vertical" className={styles.cardDescription}>
													<Typography.Text type="secondary" ellipsis>
														{item.specs}
													</Typography.Text>
													<Typography.Text type="secondary" className={styles.deviceDescription} ellipsis={{ tooltip: item.description }}>
														{item.description}
													</Typography.Text>
												</Space>
											}
										/>
									</Card>
								</Col>
							))}
						</Row>
					) : (
						<Empty className={styles.empty} description="暂无设备数据" />
					)}

					{deviceList.length > 0 && (
						<Row>
							<Pagination
								size="small"
								showQuickJumper
								showSizeChanger
								current={pageNum}
								pageSize={pageSize}
								total={deviceList.length}
								onChange={onPageChange}
								pageSizeOptions={[12, 24, 48, 96]}
								className={styles.pagination}
							/>
						</Row>
					)}
				</Spin>

				<Modal
					title="编辑设备信息"
					open={isModalOpen}
					onOk={throttledSave}
					onCancel={() => setIsModalOpen(false)}
					width={screens.md ? 600 : '95%'}
					okText="保存"
					cancelText="取消"
					mask={{ closable: false }}
					destroyOnHidden
					centered
				>
					<Form form={form} layout="vertical">
						<Row gutter={[8, 0]}>
							<Col xs={24} md={16}>
								<Form.Item name="name" label="设备名称" rules={[{ required: true }]} className={styles.modalFormItem}>
									<Input placeholder="输入设备名称" />
								</Form.Item>
							</Col>
							<Col xs={24} md={8}>
								<Form.Item name="category" label={`分类(默认为${DEFAULT_CATEGORY})`} className={styles.modalFormItem}>
									<Input placeholder="如: OnePlus" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="specs" label="规格配置" rules={[{ required: true }]} className={styles.modalFormItem}>
									<Input placeholder="如: Gray / 16G + 1TB" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<div className={styles.modalImageWrapper}>
									<Form.Item className={styles.modalFormItem} name="image" label="设备图片" rules={[{ required: true }]}>
										<Space.Compact className={styles.fullWidth}>
											<Form.Item name="image" noStyle>
												<Input placeholder="输入图片外链" />
											</Form.Item>
											<Upload showUploadList={false} beforeUpload={uploadCover} accept={imageAccept}>
												<Button loading={loading} icon={<UploadOutlined />}>
													上传
												</Button>
											</Upload>
										</Space.Compact>
									</Form.Item>
									{imageValue && <Image loading="lazy" width={screens.md ? 70 : '100%'} height={70} className={styles.modalImage} src={imageValue} />}
								</div>
							</Col>
							<Col span={24}>
								<Form.Item name="link" label="产品链接" rules={[{ required: true }]} className={styles.modalFormItem}>
									<Input placeholder="输入跳转外链" />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="description" label="详细描述" rules={[{ required: true }]} className={styles.modalFormItem}>
									<Input.TextArea placeholder="输入详细描述" rows={3} />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</Content>
		</Layout>
	)
}
