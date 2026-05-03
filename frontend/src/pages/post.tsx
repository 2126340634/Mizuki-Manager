import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, Input, Button, Upload, message, Space, Typography, Spin, Popconfirm, Table, Tag, Tooltip } from 'antd'
import { SaveOutlined, UploadOutlined, FileTextOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getAllPosts, getPostContent, updatePost, createPost, uploadPostFile, deletePost } from '../services/post'
import { debounce, throttle } from '../utils/util'
import { usePostContentDB } from '../hooks/usePostContentDB'
import { useNavigate, useParams, Routes, Route, Link } from 'react-router-dom'

const POST_FRONT_MATTER =
	'---\n' +
	'title: 标题\n' +
	`published: ${new Date().toISOString().split('T')[0]}\n` +
	'pinned: 是否置顶(true/false)\n' +
	'description: 介绍\n' +
	'tags: [标签1, 标签2, 标签3...]\n' +
	'category: 分类\n' +
	'licenseName: "CC BY 4.0"\n' +
	'author: 作者\n' +
	'sourceLink: "来源链接"\n' +
	'draft: 是否为草稿(true/false)\n' +
	`date: ${new Date().toISOString().split('T')[0]}\n` +
	'image: "封面图片链接"\n' +
	'---\n\n'

const PAGE_SIZE = 24 // 固定每页24篇

// 文章列表
function PostList() {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [posts, setPosts] = useState<string[]>([])
	const [pageNum, setPageNum] = useState(1)

	const getPosts = useCallback(async () => {
		try {
			setLoading(true)
			const res = await getAllPosts(pageNum, PAGE_SIZE)
			if (res.success) setPosts(res.data?.posts || [])
		} catch {
		} finally {
			setLoading(false)
		}
	}, [pageNum])

	const handleDelete = async (filename: string) => {
		try {
			setLoading(true)
			const res = await deletePost(filename)
			if (res.success) {
				message.success('删除成功')
				await getPosts()
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	const handleUpload = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadPostFile(file)
			if (res.success) {
				message.success('上传成功')
				await getPosts()
			}
		} catch {
		} finally {
			setLoading(false)
		}
		return false
	}

	// 初始化
	useEffect(() => {
		getPosts()
	}, [])

	const columns = [
		{
			title: '文章名称',
			dataIndex: 'title',
			key: 'title',
			render: (_: any, filename: string) => <Link to={`/post/view/${filename}`}>{filename?.replace('.md', '')}</Link>
		},
		{
			title: '操作',
			key: 'action',
			width: 100,
			render: (filename: string) => (
				<Space>
					<Tooltip title="编辑">
						<Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/post/edit/${filename}`)} />
					</Tooltip>
					<Tooltip title="查看">
						<Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/post/view/${filename}`)} />
					</Tooltip>
					<Popconfirm title="确定删除？" onConfirm={() => handleDelete(filename)}>
						<Tooltip title="删除">
							<Button type="link" danger icon={<DeleteOutlined />} />
						</Tooltip>
					</Popconfirm>
				</Space>
			)
		}
	]

	return (
		<Card
			title={
				<span style={{ marginLeft: 24 }}>
					<FileTextOutlined /> 文章管理
				</span>
			}
			style={{ width: '100%' }}
			extra={
				<Space style={{ marginLeft: 10 }}>
					<Upload showUploadList={false} beforeUpload={handleUpload} accept=".md">
						<Button icon={<UploadOutlined />}>上传</Button>
					</Upload>
					<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/post/edit/new')}>
						新建
					</Button>
				</Space>
			}
		>
			<Table
				loading={loading}
				rowKey={(record) => record}
				dataSource={posts}
				columns={columns}
				pagination={{
					pageSize: PAGE_SIZE,
					onChange: (pageNum) => setPageNum(pageNum),
					showTotal: (total) => `共 ${total} 篇`
				}}
			/>
		</Card>
	)
}

interface PostEditorProps {
	isEditing?: boolean // 是否为编辑模式
}

// 文章编辑
function PostEditor(props: PostEditorProps) {
	const { isEditing = false } = props
	const { filename = 'new' } = useParams()
	const [content, setContent] = useState('')
	const [loading, setLoading] = useState(false)
	const [showReload, setShowReload] = useState(false)
	const db = usePostContentDB()
	const isNewRef = useRef(filename === 'new')
	const cacheKeyRef = useRef(isNewRef.current ? 'new' : filename)
	const isEditingRef = useRef(isEditing)
	const filenameRef = useRef(filename)

	// 获取内容
	const getContent = useCallback(async () => {
		if (isNewRef.current) return
		try {
			setLoading(true)
			const res = await getPostContent(filenameRef.current)
			if (res.data) setContent(res.data)
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	// 清空草稿
	const _clearDraft = useCallback(async (id: number | string) => {
		await db.saveCache(id, POST_FRONT_MATTER) // 设为默认元数据头
	}, [])

	// 重载内容
	const reloadContent = useCallback(async () => {
		if (!isEditingRef.current) return
		await getContent()
		await _clearDraft(cacheKeyRef.current)
		setShowReload(false)
	}, [getContent, _clearDraft])

	// 保存
	const _handleSave = useCallback(async () => {
		if (loading || !isEditingRef.current) return
		try {
			setLoading(true)
			if (isNewRef.current) {
				const match = content.match(/^#\s+(.+)$/m)
				// 匹配 "# (标题)" 或 未命名文章-YYYY-MM-DD_hh:mm:ss
				const newFilename = (match?.[1].trim() || `未命名文章-${new Date().toISOString().slice(0, 19).replace('T', '_')}`) + '.md'
				const res = await createPost(newFilename, content)
				if (res.success) {
					message.success('创建成功')
					await _clearDraft('new')
				}
			} else {
				const res = await updatePost(filenameRef.current, content)
				if (res.success) {
					message.success('保存成功')
					await reloadContent()
				}
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [content, reloadContent, _clearDraft])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	// 保存草稿
	const _saveDraft = useCallback(async (content: string) => {
		if (!isEditingRef.current) return
		await db.saveCache(cacheKeyRef.current, content)
		setShowReload(true)
	}, [])
	const debouncedSaveDraft = useMemo(() => debounce(_saveDraft, 500), [_saveDraft])

	const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setContent(e.target.value)
		debouncedSaveDraft(e.target.value)
	}

	// 初始化
	useEffect(() => {
		db.getCache(cacheKeyRef.current).then((draft) => {
			// 判断是否为新建,新建用id为"new"的缓存,默认内容为POST_FRONT_MATTER
			if (isNewRef.current) {
				// 新建
				if (draft) setContent(draft)
				if (draft !== POST_FRONT_MATTER) setShowReload(true)
			} else {
				// 修改
				if (draft === POST_FRONT_MATTER)
					getContent() // 未修改则重新获取
				else {
					if (draft) setContent(draft) // 已修改则使用缓存
					setShowReload(true)
				}
			}
		})
	}, [])

	return (
		<Card
			title={
				<span>
					<FileTextOutlined /> {isNewRef.current ? '新建文章' : `${isEditingRef.current ? '编辑' : '查看'} ${filenameRef.current?.replace('.md', '')}`}
				</span>
			}
			style={{ width: '100%' }}
			extra={
				isEditingRef.current && (
					<>
						<a style={{ fontSize: 12 }} href="https://docs.mizuki.mysqil.com/press/file/" target="_blank">
							如何编写文章？
						</a>
						<Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={throttledSave}>
							保存
						</Button>
					</>
				)
			}
		>
			<Spin spinning={loading}>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
					<Typography.Text type="secondary">{isEditingRef.current ? '编辑' : '查看'} Markdown 文档</Typography.Text>
					{isEditingRef.current && showReload && !isNewRef.current && (
						<Popconfirm title="确定要重载为最新内容？" onConfirm={reloadContent}>
							<Button size="small" icon={<ReloadOutlined />}>
								内容重载
							</Button>
						</Popconfirm>
					)}
				</div>
				<Input.TextArea
					readOnly={!isEditingRef.current}
					value={content}
					onChange={onChange}
					autoSize={{ minRows: 15 }}
					style={{ fontFamily: 'monospace', maxHeight: 'calc(100vh - 139px)' }}
					placeholder={POST_FRONT_MATTER}
				/>
			</Spin>
		</Card>
	)
}

export default function Post() {
	return (
		<Routes>
			<Route path="/" element={<PostList />} />
			<Route path="/edit/:filename" element={<PostEditor isEditing={true} />} />
			<Route path="/view/:filename" element={<PostEditor />} />
		</Routes>
	)
}
