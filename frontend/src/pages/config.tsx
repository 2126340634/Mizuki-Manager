import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
	Card,
	Form,
	Input,
	InputNumber,
	Switch,
	Select,
	Button,
	message,
	Space,
	Typography,
	Spin,
	Popconfirm,
	Collapse,
	Row,
	Col,
	Divider,
	Empty,
	Modal,
	Tag,
	Flex,
	CollapseProps,
	Image,
	Upload
} from 'antd'
import { SaveOutlined, SettingOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons'
import { getConfigData, uploadAvatarImage, uploadHomeImage, uploadMobileWallpapers, uploadPCWallpapers, writeConfigData } from '../services/config'
import { debounce, deepMerge, throttle, unwrap, wrap } from '../utils/util'
import { useConfigContentDB } from '../hooks/useConfigContentDB'
import { imageAccept } from '../configs/uploadConfig'
import { Icon } from '@iconify/react'
import styles from '../styles/pages/config.module.scss'

const { TextArea } = Input

interface EditableListProps {
	value?: any[]
	onChange?: (value: any[]) => void
	itemRender?: (item: any, index: number, onEdit: () => void, onDelete: () => void) => React.ReactNode
	addButtonText?: string
	emptyText?: string
	modalTitle?: string
	modalFields?: (form: any, iconValue: string) => React.ReactNode
}

// 默认值
const defaultValues = {
	SITE_LANG: 'zh_CN',
	SITE_TIMEZONE: 8,
	siteConfig: {
		title: '',
		subtitle: '',
		siteURL: '',
		siteStartDate: '2026-01-01',
		themeColor: { hue: 240, fixed: false },
		featurePages: {
			anime: true,
			diary: true,
			friends: true,
			projects: true,
			skills: true,
			timeline: true,
			albums: true,
			devices: true
		},
		navbarTitle: {
			mode: 'logo',
			text: '',
			icon: '',
			logo: ''
		},
		showLastModified: true,
		generateOgImages: false,
		banner: {
			src: {
				desktop: [],
				mobile: []
			},
			position: 'center',
			carousel: {
				enable: true,
				interval: 3
			},
			waves: {
				enable: true,
				performanceMode: false,
				mobileDisable: false
			},
			imageApi: {
				enable: false,
				url: ''
			},
			homeText: {
				enable: true,
				title: '',
				subtitle: [],
				typewriter: {
					enable: true,
					speed: 100,
					deleteSpeed: 50,
					pauseTime: 2000
				}
			},
			credit: {
				enable: false,
				text: '',
				url: ''
			},
			navbar: {
				transparentMode: 'semifull'
			}
		}
	},
	fullscreenWallpaperConfig: {
		position: 'center',
		opacity: 0.8,
		blur: 1,
		zIndex: -1,
		src: {
			desktop: [],
			mobile: []
		},
		carousel: { enable: true, interval: 5 }
	},
	navBarConfig: {
		links: [
			{
				children: [
					{
						name: '',
						url: '',
						external: true,
						icon: ''
					},
					{
						name: '',
						url: '',
						external: true,
						icon: ''
					},
					{
						name: 'Gitee',
						url: '',
						external: true,
						icon: ''
					}
				]
			}
		]
	},
	profileConfig: {
		avatar: '',
		name: '',
		bio: '',
		typewriter: { enable: true, speed: 80 },
		links: []
	},
	musicPlayerConfig: {
		enable: true,
		showFloatingPlayer: true,
		floatingEntryMode: 'fab',
		mode: 'local',
		meting_api: 'https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r',
		id: '114514',
		server: 'netease',
		type: 'playlist'
	},
	commentConfig: {
		enable: false,
		system: 'twikoo',
		twikoo: { envId: 'https://twikoo.vercel.app', lang: 'zh_CN' },
		giscus: {
			repo: 'your-github-username/your-repo-name',
			repoId: 'your-repo-id',
			category: 'Announcements',
			categoryId: 'your-category-id',
			mapping: 'pathname',
			strict: '0',
			reactionsEnabled: '1',
			emitMetadata: '0',
			inputPosition: 'top',
			theme: 'preferred_color_scheme',
			lang: 'zh_CN',
			loading: 'lazy'
		}
	},
	sakuraConfig: {
		enable: true,
		sakuraNum: 8,
		limitTimes: -1,
		size: { min: 0.5, max: 1.1 },
		opacity: { min: 0.3, max: 0.9 },
		speed: { horizontal: { min: -1.7, max: -1.2 }, vertical: { min: 1.5, max: 2.2 }, rotation: 0.03, fadeSpeed: 0.03 },
		zIndex: 1
	},
	pioConfig: {
		enable: true,
		position: 'left',
		hiddenOnMobile: true,
		width: 280,
		height: 250,
		mode: 'draggable',
		dialog: { welcome: '', home: '', close: '', link: '', touch: [], skin: [] }
	},
	licenseConfig: {
		enable: true,
		name: '',
		url: ''
	},
	announcementConfig: {
		title: '',
		content: '',
		closable: true,
		link: { enable: true, text: '', url: '', external: false }
	},
	shareConfig: { enable: true },
	relatedPostsConfig: { enable: true, maxCount: 5 },
	randomPostsConfig: { enable: true, maxCount: 5 }
}

const featurePages = [
	{ name: '番剧', key: 'anime' },
	{ name: '日记', key: 'diary' },
	{ name: '友链', key: 'friends' },
	{ name: '项目', key: 'projects' },
	{ name: '技能', key: 'skills' },
	{ name: '时间线', key: 'timeline' },
	{ name: '相册', key: 'albums' },
	{ name: '设备', key: 'devices' }
]

const CustomList: React.FC<{
	dataSource: any[]
	renderItem: (item: any, index: number) => React.ReactNode
}> = ({ dataSource, renderItem }) => {
	return (
		<Flex vertical gap="small">
			{dataSource.map((item, idx) => (
				<div key={idx}>{renderItem(item, idx)}</div>
			))}
		</Flex>
	)
}

const EditableList: React.FC<EditableListProps> = ({ value = [], onChange, itemRender, addButtonText = '添加', emptyText = '暂无数据', modalTitle = '编辑项', modalFields }) => {
	const [modalVisible, setModalVisible] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [form] = Form.useForm()

	const iconValue = Form.useWatch('icon', form)

	const handleAdd = () => {
		setEditingIndex(null)
		form.resetFields()
		form.setFieldsValue({ name: '', icon: '', url: '' })
		setModalVisible(true)
	}
	const handleEdit = (index: number) => {
		setEditingIndex(index)
		form.setFieldsValue(value[index])
		setModalVisible(true)
	}
	const handleDelete = (index: number) => {
		const newList = [...value]
		newList.splice(index, 1)
		onChange?.(newList)
	}
	const handleOk = async () => {
		try {
			const values = await form.validateFields()
			const newList = [...value]
			if (editingIndex === null) {
				newList.push(values)
			} else {
				newList[editingIndex] = values
			}
			onChange?.(newList)
			setModalVisible(false)
		} catch (err) {
			console.error(err)
		}
	}

	return (
		<>
			{!value.length ? (
				<Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
			) : (
				<CustomList
					dataSource={value}
					renderItem={(item, idx) => (
						<div className={styles.listItem}>
							<div className={styles.listItemContent}>
								{itemRender ? (
									itemRender(
										item,
										idx,
										() => handleEdit(idx),
										() => handleDelete(idx)
									)
								) : (
									<Typography.Text ellipsis>{JSON.stringify(item)}</Typography.Text>
								)}
							</div>
							<Space>
								<Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(idx)} />
								<Popconfirm title="确定删除？" onConfirm={() => handleDelete(idx)}>
									<Button size="small" danger icon={<DeleteOutlined />} />
								</Popconfirm>
							</Space>
						</div>
					)}
				/>
			)}
			<Button type="dashed" block icon={<PlusOutlined />} onClick={handleAdd} className={styles.addButton}>
				{addButtonText}
			</Button>
			<Modal destroyOnHidden mask={{ closable: false }} title={modalTitle} open={modalVisible} onOk={handleOk} onCancel={() => setModalVisible(false)} width={600}>
				<Form form={form} layout="vertical">
					{modalFields?.(form, iconValue)}
				</Form>
			</Modal>
		</>
	)
}

const StringListEditor: React.FC<{
	value?: string[]
	onChange?: (val: string[]) => void
	addText?: string
	imageMode?: boolean
	uploadImage?: (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => Promise<boolean>
}> = ({ value = [], onChange, addText = '添加', imageMode = false, uploadImage = () => false }) => {
	const [inputVal, setInputVal] = useState('')

	const addItem = () => {
		const val = inputVal.trim()
		if (val) {
			onChange?.([...value, val])
			setInputVal('')
		}
	}
	const removeItem = (index: number) => {
		const newList = [...value]
		newList.splice(index, 1)
		onChange?.(newList)
	}
	const uploadItem = (urls: string[]) => {
		onChange?.([...value, ...urls.filter((url) => url.trim())])
	}

	return (
		<>
			<Space wrap className={styles.tagSpace}>
				{value.map((item, i) => (
					<div className={styles.tagItem}>
						{imageMode && <Image loading="lazy" width={70} height={70} className={styles.tagImage} src={item} alt={item} />}
						<Tag key={i} closable onClose={() => removeItem(i)} className={styles.tag}>
							<Typography.Text ellipsis={{ tooltip: item }}>{item}</Typography.Text>
						</Tag>
					</div>
				))}
			</Space>
			<Space.Compact className={styles.fullWidth}>
				<Input value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder="输入内容后添加" />
				{imageMode && (
					<Upload accept={imageAccept} beforeUpload={(file: File, fileList: File[]) => uploadImage(file, fileList, (urls) => uploadItem(urls))} showUploadList={false} multiple>
						<Button>
							<UploadOutlined />
							<span>上传</span>
						</Button>
					</Upload>
				)}
				<Button onClick={addItem}>
					<PlusOutlined />
					<span>{addText}</span>
				</Button>
			</Space.Compact>
		</>
	)
}

const collapseItems = (
	uploadHomeImg: (file: File, fileList: File[], onSuccess?: (url: string) => void) => Promise<boolean>,
	uploadAvatar: (file: File, fileList: File[], onSuccess?: (url: string) => void) => Promise<boolean>,
	uploadPCWallpaperImages: (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => Promise<boolean>,
	uploadMobileWallpaperImages: (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => Promise<boolean>
): CollapseProps['items'] => [
	// 基础配置
	{
		key: 'basic',
		label: '基础配置',

		children: (
			<Row gutter={[8, 0]}>
				<Col xs={24} md={12}>
					<Form.Item name="SITE_LANG" label="站点语言">
						<Select
							options={[
								{ label: '简体中文', value: 'zh_CN' },
								{ label: 'English', value: 'en' },
								{ label: '日本語', value: 'ja' }
							]}
						/>
					</Form.Item>
				</Col>
				<Col xs={24} md={12}>
					<Form.Item name="SITE_TIMEZONE" label="时区偏移(-12~12, 例如中国为+8)">
						<InputNumber min={-12} max={12} className={styles.fullWidth} />
					</Form.Item>
				</Col>
			</Row>
		)
	},
	// 站点外观
	{
		key: 'site',
		label: '站点外观',

		children: (
			<>
				<Row gutter={[8, 0]}>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'title']} label="站点标题">
							<Input />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'subtitle']} label="副标题">
							<Input />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'siteStartDate']} label="建站日期">
							<Input placeholder="2026-01-01" />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'themeColor', 'hue']} label="主题色色相">
							<InputNumber min={0} max={360} className={styles.fullWidth} />
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item name={['siteConfig', 'siteURL']} label="站点URL">
							<Input />
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item name={['siteConfig', 'themeColor', 'fixed']} label="固定主题色" valuePropName="checked">
							<Switch />
						</Form.Item>
					</Col>
				</Row>
				<Divider orientation="horizontal">功能页面</Divider>
				<Row gutter={[8, 0]}>
					{featurePages.map((f) => (
						<Col span={6} key={f.key}>
							<Form.Item name={['siteConfig', 'featurePages', f.key]} label={f.name} valuePropName="checked">
								<Switch />
							</Form.Item>
						</Col>
					))}
				</Row>
				<Divider orientation="horizontal">导航栏标题</Divider>
				<Row gutter={[8, 0]}>
					<Col span={12}>
						<Form.Item name={['siteConfig', 'navbarTitle', 'mode']} label="模式">
							<Select
								options={[
									{ label: '仅显示Logo', value: 'logo' },
									{ label: '显示Logo+文本', value: 'text-icon' }
								]}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name={['siteConfig', 'navbarTitle', 'text']} label="文字">
							<Input />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item label="图标路径" className={styles.formItemNoMargin}>
							<Space.Compact className={styles.fullWidth}>
								<Form.Item name={['siteConfig', 'navbarTitle', 'icon']} noStyle>
									<Input placeholder="例如: assets/home/home.png" />
								</Form.Item>
								<Form.Item noStyle shouldUpdate={(prev, cur) => prev?.siteConfig?.navbarTitle?.icon !== cur?.siteConfig?.navbarTitle?.icon}>
									{({ setFieldValue }) => (
										<Upload
											accept={imageAccept}
											beforeUpload={(file: File, fileList: File[]) => {
												uploadHomeImg(file, fileList, (url) => setFieldValue(['siteConfig', 'navbarTitle', 'icon'], url))
											}}
											showUploadList={false}
										>
											<Button>
												<UploadOutlined />
												<span>上传</span>
											</Button>
										</Upload>
									)}
								</Form.Item>
							</Space.Compact>
						</Form.Item>
						<Form.Item noStyle shouldUpdate={(prev, cur) => prev?.siteConfig?.navbarTitle?.icon !== cur?.siteConfig?.navbarTitle?.icon}>
							{({ getFieldValue }) => {
								const url = getFieldValue(['siteConfig', 'navbarTitle', 'icon'])
								return <Image loading="lazy" width="100%" height={80} className={styles.previewImage} src={url} alt={url} />
							}}
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item label="Logo路径" className={styles.formItemNoMargin}>
							<Space.Compact className={styles.fullWidth}>
								<Form.Item name={['siteConfig', 'navbarTitle', 'logo']} noStyle>
									<Input placeholder="例如: assets/home/default-logo.png" />
								</Form.Item>
								<Form.Item noStyle shouldUpdate={(prev, cur) => prev?.siteConfig?.navbarTitle?.logo !== cur?.siteConfig?.navbarTitle?.logo}>
									{({ setFieldValue }) => (
										<Upload
											accept={imageAccept}
											beforeUpload={(file: File, fileList: File[]) => {
												uploadHomeImg(file, fileList, (url) => setFieldValue(['siteConfig', 'navbarTitle', 'logo'], url))
											}}
											showUploadList={false}
										>
											<Button>
												<UploadOutlined />
												<span>上传</span>
											</Button>
										</Upload>
									)}
								</Form.Item>
							</Space.Compact>
						</Form.Item>
						<Form.Item noStyle shouldUpdate={(prev, cur) => prev?.siteConfig?.navbarTitle?.logo !== cur?.siteConfig?.navbarTitle?.logo}>
							{({ getFieldValue }) => {
								const url = getFieldValue(['siteConfig', 'navbarTitle', 'logo'])
								return <Image loading="lazy" width="100%" height={80} className={styles.previewImage} src={url} alt={url} />
							}}
						</Form.Item>
					</Col>
				</Row>
				<Form.Item name={['siteConfig', 'showLastModified']} valuePropName="checked" label="显示最后修改时间">
					<Switch />
				</Form.Item>
				<Form.Item name={['siteConfig', 'generateOgImages']} valuePropName="checked" label="生成OpenGraph图片">
					<Switch />
				</Form.Item>
			</>
		)
	},
	// 全屏壁纸
	{
		key: 'wallpaper',
		label: '全屏壁纸',

		children: (
			<Row gutter={[8, 0]}>
				<Col xs={24} md={8}>
					<Form.Item name={['fullscreenWallpaperConfig', 'position']} label="壁纸位置">
						<Select
							options={[
								{ label: '居中', value: 'center' },
								{ label: '顶部', value: 'top' },
								{ label: '底部', value: 'bottom' },
								{ label: '左侧', value: 'left' },
								{ label: '右侧', value: 'right' }
							]}
						/>
					</Form.Item>
				</Col>
				<Col xs={24} md={8}>
					<Form.Item name={['fullscreenWallpaperConfig', 'opacity']} label="透明度">
						<InputNumber min={0} max={1} step={0.1} className={styles.fullWidth} />
					</Form.Item>
				</Col>
				<Col xs={24} md={8}>
					<Form.Item name={['fullscreenWallpaperConfig', 'blur']} label="模糊度">
						<InputNumber min={0} max={10} className={styles.fullWidth} />
					</Form.Item>
				</Col>
				<Col span={24}>
					<Form.Item label="桌面端壁纸" name={['fullscreenWallpaperConfig', 'src', 'desktop']}>
						<StringListEditor imageMode={true} uploadImage={uploadPCWallpaperImages} />
					</Form.Item>
				</Col>
				<Col span={24}>
					<Form.Item label="移动端壁纸" name={['fullscreenWallpaperConfig', 'src', 'mobile']}>
						<StringListEditor imageMode={true} uploadImage={uploadMobileWallpaperImages} />
					</Form.Item>
				</Col>
				<Col span={24}>
					<Form.Item name={['fullscreenWallpaperConfig', 'carousel', 'enable']} valuePropName="checked" label="轮播开关">
						<Switch />
					</Form.Item>
				</Col>
				<Col xs={24} md={12}>
					<Form.Item name={['fullscreenWallpaperConfig', 'carousel', 'interval']} label="轮播间隔(秒)">
						<InputNumber min={1} className={styles.fullWidth} />
					</Form.Item>
				</Col>
				<Col xs={24} md={12}>
					<Form.Item name={['fullscreenWallpaperConfig', 'zIndex']} label="层级">
						<InputNumber className={styles.fullWidth} />
					</Form.Item>
				</Col>
			</Row>
		)
	},
	// 横幅配置
	{
		key: 'banner',
		label: '横幅配置',
		children: (
			<>
				{/* 横幅图片 */}
				<Form.Item label="桌面端横幅" name={['siteConfig', 'banner', 'src', 'desktop']}>
					<StringListEditor imageMode={true} uploadImage={uploadPCWallpaperImages} />
				</Form.Item>
				<Form.Item label="移动端横幅" name={['siteConfig', 'banner', 'src', 'mobile']}>
					<StringListEditor imageMode={true} uploadImage={uploadMobileWallpaperImages} />
				</Form.Item>

				<Divider orientation="horizontal">基础设置</Divider>

				<Row gutter={[8, 0]}>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'banner', 'position']} label="图片位置">
							<Select
								options={[
									{ label: '居中', value: 'center' },
									{ label: '顶部', value: 'top' },
									{ label: '底部', value: 'bottom' }
								]}
							/>
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'banner', 'navbar', 'transparentMode']} label="导航栏透明模式">
							<Select
								options={[
									{ label: '半透明+圆角', value: 'semi' },
									{ label: '完全透明', value: 'full' },
									{ label: '动态透明', value: 'semifull' }
								]}
							/>
						</Form.Item>
					</Col>
				</Row>

				{/* 轮播配置 */}
				<Divider orientation="horizontal">轮播配置</Divider>

				<Form.Item name={['siteConfig', 'banner', 'carousel', 'enable']} valuePropName="checked" label="启用轮播">
					<Switch />
				</Form.Item>

				<Form.Item name={['siteConfig', 'banner', 'carousel', 'interval']} label="轮播间隔(秒)">
					<InputNumber min={1} />
				</Form.Item>

				{/* 水波纹效果 */}
				<Divider orientation="horizontal">水波纹效果</Divider>

				<Form.Item name={['siteConfig', 'banner', 'waves', 'enable']} valuePropName="checked" label="启用水波纹">
					<Switch />
				</Form.Item>

				<Row gutter={[8, 0]}>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'banner', 'waves', 'performanceMode']} valuePropName="checked" label="性能模式">
							<Switch />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['siteConfig', 'banner', 'waves', 'mobileDisable']} valuePropName="checked" label="移动端禁用">
							<Switch />
						</Form.Item>
					</Col>
				</Row>

				{/* 图片API */}
				<Divider orientation="horizontal">图片API (PicFlow)</Divider>

				<Form.Item name={['siteConfig', 'banner', 'imageApi', 'enable']} valuePropName="checked" label="启用图片API">
					<Switch />
				</Form.Item>

				<Form.Item name={['siteConfig', 'banner', 'imageApi', 'url']} label="API地址">
					<Input placeholder="http://domain.com/api_v2.php?format=text&count=4" />
				</Form.Item>

				{/* 主页文字配置 */}
				<Divider orientation="horizontal">主页文字</Divider>

				<Form.Item name={['siteConfig', 'banner', 'homeText', 'enable']} valuePropName="checked" label="启用主页文字">
					<Switch />
				</Form.Item>

				<Form.Item name={['siteConfig', 'banner', 'homeText', 'title']} label="主标题">
					<Input placeholder="输入主标题" />
				</Form.Item>

				<Form.Item label="副标题列表" name={['siteConfig', 'banner', 'homeText', 'subtitle']}>
					<StringListEditor addText="添加" />
				</Form.Item>

				{/* 打字机效果 */}
				<Divider orientation="horizontal">打字机效果</Divider>

				<Form.Item name={['siteConfig', 'banner', 'homeText', 'typewriter', 'enable']} valuePropName="checked" label="启用打字机效果">
					<Switch />
				</Form.Item>

				<Row gutter={[8, 0]}>
					<Col xs={24} md={8}>
						<Form.Item name={['siteConfig', 'banner', 'homeText', 'typewriter', 'speed']} label="打字速度(ms)">
							<InputNumber min={20} max={500} step={10} className={styles.fullWidth} />
						</Form.Item>
					</Col>
					<Col xs={24} md={8}>
						<Form.Item name={['siteConfig', 'banner', 'homeText', 'typewriter', 'deleteSpeed']} label="删除速度(ms)">
							<InputNumber min={20} max={500} step={10} className={styles.fullWidth} />
						</Form.Item>
					</Col>
					<Col xs={24} md={8}>
						<Form.Item name={['siteConfig', 'banner', 'homeText', 'typewriter', 'pauseTime']} label="暂停时间(ms)">
							<InputNumber min={500} max={10000} step={500} className={styles.fullWidth} />
						</Form.Item>
					</Col>
				</Row>

				{/* 图片来源 */}
				<Divider orientation="horizontal">图片来源</Divider>

				<Form.Item name={['siteConfig', 'banner', 'credit', 'enable']} valuePropName="checked" label="显示图片来源">
					<Switch />
				</Form.Item>

				<Form.Item name={['siteConfig', 'banner', 'credit', 'text']} label="来源文本">
					<Input placeholder="Describe" />
				</Form.Item>

				<Form.Item name={['siteConfig', 'banner', 'credit', 'url']} label="来源链接">
					<Input placeholder="https://..." />
				</Form.Item>
			</>
		)
	},
	// 导航链接配置
	{
		key: 'navbar',
		label: '导航链接',
		children: (
			<Form.Item name={['navBarConfig', 'links', 2, 'children']}>
				<EditableList
					addButtonText="添加导航链接"
					modalTitle="编辑导航链接"
					modalFields={(_, iconValue) => (
						<>
							<Form.Item name="name" label="名称" rules={[{ required: true }]}>
								<Input placeholder="请输入名称" />
							</Form.Item>
							<Form.Item
								name="icon"
								label={
									<>
										<span>图标</span>
										<a href={process.env.ICONIFY_URL} target="_blank">
											&nbsp;访问 iconify
										</a>
									</>
								}
							>
								<Input placeholder="例如: mdi:github" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : <span />} />
							</Form.Item>
							<Form.Item name="url" label="链接" rules={[{ required: true }]}>
								<Input placeholder="请输入链接" />
							</Form.Item>
							<Form.Item name="external" label="外部链接" valuePropName="checked">
								<Switch />
							</Form.Item>
						</>
					)}
					itemRender={(item) => (
						<div className={styles.linkItem}>
							<Tag>{item.name}</Tag>
							{item.icon && <Icon icon={item.icon} width={20} />}
							<Typography.Text copyable>{item.url}</Typography.Text>
							{item.external && <Tag>外链</Tag>}
						</div>
					)}
				/>
			</Form.Item>
		)
	},
	// 个人资料
	{
		key: 'profile',
		label: '个人资料',
		children: (
			<>
				<Form.Item label="头像路径" className={styles.formItemNoMargin}>
					<Space.Compact className={styles.fullWidth}>
						<Form.Item name={['profileConfig', 'avatar']} noStyle>
							<Input placeholder="例如: assets/images/avatar.webp" />
						</Form.Item>
						<Form.Item noStyle shouldUpdate={(prev, cur) => prev?.profileConfig?.avatar !== cur?.profileConfig?.avatar}>
							{({ setFieldValue }) => (
								<Upload
									beforeUpload={(file: File, fileList: File[]) => {
										uploadAvatar(file, fileList, (url) => setFieldValue(['profileConfig', 'avatar'], url))
									}}
									showUploadList={false}
								>
									<Button>
										<UploadOutlined />
										<span>上传</span>
									</Button>
								</Upload>
							)}
						</Form.Item>
					</Space.Compact>
				</Form.Item>
				<Form.Item noStyle shouldUpdate={(prev, cur) => prev?.profileConfig?.avatar !== cur?.profileConfig?.avatar}>
					{({ getFieldValue }) => {
						const url = getFieldValue(['profileConfig', 'avatar'])
						return <Image loading="lazy" width="100%" height={80} className={styles.previewImage} src={url} alt={url} />
					}}
				</Form.Item>
				<Form.Item name={['profileConfig', 'name']} label="昵称">
					<Input />
				</Form.Item>
				<Form.Item name={['profileConfig', 'bio']} label="简介">
					<TextArea rows={3} />
				</Form.Item>
				<Form.Item name={['profileConfig', 'typewriter', 'enable']} valuePropName="checked" label="打字机效果">
					<Switch />
				</Form.Item>
				<Form.Item name={['profileConfig', 'typewriter', 'speed']} label="打字速度(ms)">
					<InputNumber min={20} max={500} step={10} />
				</Form.Item>
				<Form.Item name={['profileConfig', 'links']} label="社交链接">
					<EditableList
						addButtonText="添加链接"
						modalTitle="编辑社交链接"
						modalFields={(_, iconValue) => (
							<>
								<Form.Item name="name" label="名称" rules={[{ required: true }]}>
									<Input placeholder="请输入名称" />
								</Form.Item>
								<Form.Item
									name="icon"
									label={
										<>
											<span>图标</span>
											<a href={process.env.ICONIFY_URL} target="_blank">
												&nbsp;访问 iconify
											</a>
										</>
									}
									rules={[{ required: true }]}
								>
									<Input placeholder="例如: fa7-brands:github" suffix={iconValue ? <Icon icon={iconValue} width={20} height={20} /> : <span />} />
								</Form.Item>
								<Form.Item name="url" label="链接" rules={[{ required: true }]}>
									<Input placeholder="请输入链接" />
								</Form.Item>
							</>
						)}
						itemRender={(item) => (
							<div className={styles.linkItem}>
								<Tag className={styles.linkTag}>
									<Typography.Text ellipsis={{ tooltip: item.name }}>{item.name}</Typography.Text>
								</Tag>
								<Icon icon={item.icon} fontSize={20}></Icon>
								<Typography.Text className={styles.linkUrl} copyable ellipsis={{ tooltip: item.url }}>
									{item.url}
								</Typography.Text>
							</div>
						)}
					/>
				</Form.Item>
			</>
		)
	},
	// 音乐播放器
	{
		key: 'music',
		label: '音乐播放器',

		children: (
			<>
				<Form.Item name={['musicPlayerConfig', 'enable']} valuePropName="checked" label="启用">
					<Switch />
				</Form.Item>
				<Form.Item name={['musicPlayerConfig', 'showFloatingPlayer']} valuePropName="checked" label="显示悬浮播放器">
					<Switch />
				</Form.Item>
				<Form.Item name={['musicPlayerConfig', 'floatingEntryMode']} label="悬浮入口模式">
					<Select
						options={[
							{ label: '独立悬浮播放器', value: 'default' },
							{ label: '集成到通用FAB', value: 'fab' }
						]}
					/>
				</Form.Item>
				<Form.Item name={['musicPlayerConfig', 'mode']} label="播放源">
					<Select
						options={[
							{ label: '本地', value: 'local' },
							{ label: 'Meting', value: 'meting' }
						]}
					/>
				</Form.Item>
				<Form.Item name={['musicPlayerConfig', 'meting_api']} label="Meting API地址">
					<Input placeholder="https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r" />
				</Form.Item>
				<Form.Item name={['musicPlayerConfig', 'id']} label="歌单ID">
					<Input />
				</Form.Item>
				<Form.Item name={['musicPlayerConfig', 'server']} label="平台">
					<Input placeholder="例如: netease/tencent/kugou" />
				</Form.Item>
				<Form.Item name={['musicPlayerConfig', 'type']} label="播放类型">
					<Select options={[{ label: '歌单', value: 'playlist' }]} />
				</Form.Item>
			</>
		)
	},
	// 评论配置
	{
		key: 'comment',
		label: '评论配置',

		children: (
			<>
				<Form.Item name={['commentConfig', 'enable']} valuePropName="checked" label="启用评论">
					<Switch />
				</Form.Item>
				<Form.Item name={['commentConfig', 'system']} label="评论系统">
					<Select
						options={[
							{ label: 'Twikoo', value: 'twikoo' },
							{ label: 'Giscus', value: 'giscus' }
						]}
					/>
				</Form.Item>
				<Form.Item noStyle shouldUpdate={(prev, curr) => prev.commentConfig?.system !== curr.commentConfig?.system}>
					{({ getFieldValue }) => {
						const system = getFieldValue(['commentConfig', 'system'])
						if (system === 'twikoo') {
							return (
								<Form.Item name={['commentConfig', 'twikoo', 'envId']} label="Twikoo环境ID">
									<Input />
								</Form.Item>
							)
						}
						if (system === 'giscus') {
							return (
								<>
									<Form.Item name={['commentConfig', 'giscus', 'repo']} label="Giscus仓库" rules={[{ required: true }]}>
										<Input placeholder="username/repo-name" />
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'repoId']} label="仓库ID" rules={[{ required: true }]}>
										<Input />
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'category']} label="分类" rules={[{ required: true }]}>
										<Input />
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'categoryId']} label="分类ID" rules={[{ required: true }]}>
										<Input />
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'mapping']} label="映射">
										<Select
											defaultValue="pathname"
											options={[
												{ label: 'pathname', value: 'pathname' },
												{ label: 'url', value: 'url' },
												{ label: 'title', value: 'title' },
												{ label: 'og:title', value: 'og:title' }
											]}
										/>
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'strict']} label="严格模式">
										<Select
											options={[
												{ label: '0', value: '0' },
												{ label: '1', value: '1' }
											]}
										/>
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'reactionsEnabled']} label="启用表情">
										<Select
											options={[
												{ label: '1', value: '1' },
												{ label: '0', value: '0' }
											]}
										/>
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'inputPosition']} label="输入位置">
										<Select
											options={[
												{ label: 'top', value: 'top' },
												{ label: 'bottom', value: 'bottom' }
											]}
										/>
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'theme']} label="主题">
										<Select
											options={[
												{ label: '跟随系统', value: 'preferred_color_scheme' },
												{ label: '浅色', value: 'light' },
												{ label: '深色', value: 'dark' }
											]}
										/>
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'lang']} label="语言">
										<Select
											options={[
												{ label: '中文', value: 'zh_CN' },
												{ label: '英文', value: 'en' }
											]}
										/>
									</Form.Item>
									<Form.Item name={['commentConfig', 'giscus', 'loading']} label="加载方式">
										<Select
											options={[
												{ label: 'lazy', value: 'lazy' },
												{ label: 'eager', value: 'eager' }
											]}
										/>
									</Form.Item>
								</>
							)
						}
						return null
					}}
				</Form.Item>
			</>
		)
	},
	// 樱花特效
	{
		key: 'sakura',
		label: '樱花特效',

		children: (
			<>
				<Row gutter={[8, 0]}>
					<Col span={24}>
						<Form.Item name={['sakuraConfig', 'enable']} valuePropName="checked" label="启用樱花">
							<Switch />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'sakuraNum']} label="樱花数量">
							<InputNumber min={1} max={50} className={styles.fullWidth} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'limitTimes']} label="越界限制次数(-1为无限)">
							<InputNumber min={-1} className={styles.fullWidth} />
						</Form.Item>
					</Col>
				</Row>
				<Divider orientation="horizontal">尺寸范围</Divider>
				<Row gutter={[8, 0]}>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'size', 'min']} label="最小尺寸倍数">
							<InputNumber min={0.1} max={2} step={0.1} className={styles.fullWidth} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'size', 'max']} label="最大尺寸倍数">
							<InputNumber min={0.1} max={2} step={0.1} className={styles.fullWidth} />
						</Form.Item>
					</Col>
				</Row>
				<Divider orientation="horizontal">透明度</Divider>
				<Row gutter={[8, 0]}>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'opacity', 'min']} label="最小透明度">
							<InputNumber min={0} max={1} step={0.1} className={styles.fullWidth} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'opacity', 'max']} label="最大透明度">
							<InputNumber min={0} max={1} step={0.1} className={styles.fullWidth} />
						</Form.Item>
					</Col>
				</Row>
				<Divider orientation="horizontal">速度</Divider>
				<Row gutter={[8, 0]}>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'speed', 'horizontal', 'min']} label="水平速度最小值">
							<InputNumber className={styles.fullWidth} step={0.1} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'speed', 'horizontal', 'max']} label="水平速度最大值">
							<InputNumber className={styles.fullWidth} step={0.1} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'speed', 'vertical', 'min']} label="垂直速度最小值">
							<InputNumber className={styles.fullWidth} step={0.1} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'speed', 'vertical', 'max']} label="垂直速度最大值">
							<InputNumber className={styles.fullWidth} step={0.1} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'speed', 'rotation']} label="旋转速度">
							<InputNumber className={styles.fullWidth} step={0.01} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['sakuraConfig', 'speed', 'fadeSpeed']} label="消失速度">
							<InputNumber className={styles.fullWidth} step={0.01} />
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item name={['sakuraConfig', 'zIndex']} label="层级">
							<InputNumber />
						</Form.Item>
					</Col>
				</Row>
			</>
		)
	},
	// 看板娘
	{
		key: 'pio',
		label: '看板娘',

		children: (
			<>
				<Row gutter={[8, 0]}>
					<Col span={24}>
						<Form.Item name={['pioConfig', 'enable']} valuePropName="checked" label="启用">
							<Switch />
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item name={['pioConfig', 'hiddenOnMobile']} valuePropName="checked" label="移动端隐藏">
							<Switch />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'position']} label="位置">
							<Select
								options={[
									{ label: '左侧', value: 'left' },
									{ label: '右侧', value: 'right' }
								]}
							/>
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'mode']} label="模式">
							<Select
								options={[
									{ label: '可拖拽', value: 'draggable' },
									{ label: '固定', value: 'fixed' }
								]}
							/>
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'width']} label="宽度(px)">
							<InputNumber min={100} className={styles.fullWidth} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'height']} label="高度(px)">
							<InputNumber min={100} className={styles.fullWidth} />
						</Form.Item>
					</Col>
				</Row>
				<Divider orientation="horizontal">对话框配置</Divider>
				<Row gutter={[8, 0]}>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'dialog', 'welcome']} label="欢迎语">
							<Input />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'dialog', 'home']} label="首页提示">
							<Input />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'dialog', 'close']} label="关闭提示">
							<Input />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item name={['pioConfig', 'dialog', 'link']} label="关于链接">
							<Input />
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item name={['pioConfig', 'dialog', 'touch']} label="触摸提示">
							<StringListEditor addText="添加提示" />
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item name={['pioConfig', 'dialog', 'skin']} label="换装提示">
							<StringListEditor addText="添加提示" />
						</Form.Item>
					</Col>
				</Row>
			</>
		)
	},
	// 其他
	{
		key: 'other',
		label: '其他',

		children: (
			<>
				{/* 版权声明 */}
				<Divider orientation="horizontal">版权声明</Divider>
				<Form.Item name={['licenseConfig', 'enable']} valuePropName="checked" label="启用版权声明">
					<Switch />
				</Form.Item>
				<Form.Item name={['licenseConfig', 'name']} label="许可证名称">
					<Input />
				</Form.Item>
				<Form.Item name={['licenseConfig', 'url']} label="许可证链接" rules={[{ message: '请输入有效的URL' }]}>
					<Input placeholder="https://creativecommons.org/licenses/by-nc-sa/4.0/" />
				</Form.Item>

				{/* 公告配置 */}
				<Divider orientation="horizontal">公告配置</Divider>
				<Form.Item name={['announcementConfig', 'title']} label="公告标题">
					<Input placeholder="留空使用默认标题" />
				</Form.Item>
				<Form.Item name={['announcementConfig', 'content']} label="公告内容">
					<TextArea rows={5} />
				</Form.Item>
				<Form.Item name={['announcementConfig', 'closable']} valuePropName="checked" label="公告可关闭">
					<Switch />
				</Form.Item>
				<Form.Item name={['announcementConfig', 'link', 'enable']} valuePropName="checked" label="公告链接">
					<Switch />
				</Form.Item>
				<Form.Item name={['announcementConfig', 'link', 'text']} label="链接文本">
					<Input placeholder="了解更多" />
				</Form.Item>
				<Form.Item name={['announcementConfig', 'link', 'url']} label="链接地址">
					<Input placeholder="/about/" />
				</Form.Item>
				<Form.Item name={['announcementConfig', 'link', 'external']} valuePropName="checked" label="外部链接">
					<Switch />
				</Form.Item>

				{/* 其他功能 */}
				<Divider orientation="horizontal">其他功能</Divider>
				<Form.Item name={['shareConfig', 'enable']} valuePropName="checked" label="分享功能">
					<Switch />
				</Form.Item>
				<Form.Item name={['relatedPostsConfig', 'enable']} valuePropName="checked" label="相关文章">
					<Switch />
				</Form.Item>
				<Form.Item name={['relatedPostsConfig', 'maxCount']} label="相关文章最大数量">
					<InputNumber min={1} max={20} />
				</Form.Item>
				<Form.Item name={['randomPostsConfig', 'enable']} valuePropName="checked" label="随机文章">
					<Switch />
				</Form.Item>
				<Form.Item name={['randomPostsConfig', 'maxCount']} label="随机文章最大数量">
					<InputNumber min={1} max={20} />
				</Form.Item>
			</>
		)
	}
]

export default function Config() {
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [showReload, setShowReload] = useState(false)
	const db = useConfigContentDB()
	const originalData = useRef<any>(null) // 存表单修改前数据
	const [msgApi, msgContextHolder] = message.useMessage()

	// 获取配置数据
	const getConfig = useCallback(async () => {
		try {
			setLoading(true)
			const res = await getConfigData()
			if (res.data && typeof res.data === 'object') {
				// 保存原始数据
				originalData.current = res.data // {value, comment}
				await db.saveCache('original_data', JSON.stringify(res.data))
				// 解包value给表单
				const unwrappedData = unwrap(res.data, 'value')
				form.setFieldsValue(unwrappedData)
			} else msgApi.error('配置数据无效')
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	// 重载最新数据
	const reloadContent = useCallback(async () => {
		await getConfig()
		await db.clearCache('latest')
		setShowReload(false)
		msgApi.info('已重载为最新配置')
	}, [getConfig])

	// 保存
	const _handleSave = useCallback(async () => {
		if (loading) return
		try {
			setLoading(true)
			const values = await form.validateFields()
			const draft = JSON.parse(await db.getCache('latest'))
			const merged = deepMerge(draft, values) // 表单最新值覆盖掉缓存值
			const finalData = wrap(originalData.current, merged, 'value')
			const res = await writeConfigData(finalData)
			originalData.current = finalData
			if (res.success) {
				msgApi.success('保存成功')
				await db.clearCache('latest')
				await db.saveCache('original_data', JSON.stringify(finalData))
				setShowReload(false)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	// 保存草稿
	const _handleSaveDraft = useCallback(async (values: any) => {
		if (values) {
			await db.saveCache('latest', JSON.stringify(values))
			setShowReload(true)
		}
	}, [])
	const debouncedSaveDraft = useMemo(() => debounce(_handleSaveDraft, 500), [_handleSaveDraft])

	// 上传文件
	const _uploadFiles = async (file: File, fileList: File[], uploadFunc: (file: File, fileList: File[]) => Promise<any>): Promise<any> => {
		if (file === fileList[fileList.length - 1]) {
			try {
				setLoading(true)
				const res = await uploadFunc(file, fileList)
				if (res.success) {
					msgApi.success('上传成功')
					return res
				}
			} catch {
			} finally {
				setLoading(false)
			}
		}
		return false
	}
	// 上传Logo或Icon
	const uploadHomeImg = async (file: File, fileList: File[], onSuccess?: (url: string) => void) => {
		const res = await _uploadFiles(file, fileList, (file: File) => uploadHomeImage(file))
		if (res.success) {
			onSuccess?.(res.data?.[0]?.publicPath)
			debouncedSaveDraft(form.getFieldsValue())
		}
		return false
	}
	// 上传头像
	const uploadAvatar = async (file: File, fileList: File[], onSuccess?: (url: string) => void) => {
		const res = await _uploadFiles(file, fileList, (file: File) => uploadAvatarImage(file))
		if (res.success) {
			onSuccess?.(res.data?.[0]?.publicPath)
			debouncedSaveDraft(form.getFieldsValue())
		}
		return false
	}
	// 上传PC壁纸
	const uploadPCWallpaperImages = async (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => {
		const res = await _uploadFiles(file, fileList, (_: File, fileList: File[]) => uploadPCWallpapers(fileList))
		if (res.success) onSuccess?.(res.data?.map((item: any) => item.publicPath))
		return false
	}
	// 上传移动端壁纸
	const uploadMobileWallpaperImages = async (file: File, fileList: File[], onSuccess?: (urls: string[]) => void) => {
		const res = await _uploadFiles(file, fileList, (_: File, fileList: File[]) => uploadMobileWallpapers(fileList))
		if (res.success) onSuccess?.(res.data?.map((item: any) => item.publicPath))
		return false
	}

	// 初始化
	useEffect(() => {
		db.getCache('latest').then((draft) => {
			if (draft) {
				try {
					// 表单修改缓存
					const draftValue = JSON.parse(draft)
					if (draftValue && typeof draftValue === 'object') {
						// 原始数据缓存
						db.getCache('original_data').then((original) => {
							if (original) {
								const originalValue = JSON.parse(original)
								if (originalValue && typeof originalValue === 'object') {
									originalData.current = originalValue
									form.setFieldsValue(draftValue)
									setShowReload(true) // 只要有修改数据缓存就显示重载按钮
								} else throw new Error('原始缓存无效')
							} else throw new Error('原始缓存无效')
						})
					} else throw new Error('修改数据缓存无效')
				} catch {
					getConfig()
				}
			} else {
				getConfig()
			}
		})
	}, [])

	return (
		<>
			{msgContextHolder}
			<Card
				title={
					<span className={styles.cardTitle}>
						<SettingOutlined /> 配置管理
					</span>
				}
				className={styles.card}
				extra={
					showReload ? (
						<Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={throttledSave}>
							保存
						</Button>
					) : null
				}
			>
				<Spin spinning={loading}>
					<div className={styles.cardHeader}>
						<Typography.Text type="secondary">编辑配置项</Typography.Text>
						{showReload && (
							<Popconfirm title="当前有未保存的草稿，确定放弃并重载？" onConfirm={reloadContent}>
								<Button size="small" icon={<ReloadOutlined />} loading={loading}>
									内容重载
								</Button>
							</Popconfirm>
						)}
					</div>

					<Form form={form} layout="vertical" onValuesChange={() => debouncedSaveDraft(form.getFieldsValue(true))} initialValues={defaultValues}>
						<Collapse className={styles.collapse} items={collapseItems(uploadHomeImg, uploadAvatar, uploadPCWallpaperImages, uploadMobileWallpaperImages)} />
					</Form>
				</Spin>
			</Card>
		</>
	)
}
