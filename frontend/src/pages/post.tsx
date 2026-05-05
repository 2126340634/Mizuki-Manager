import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, Input, Button, Upload, message, Space, Typography, Spin, Popconfirm, Table, Tooltip } from 'antd'
import { SaveOutlined, UploadOutlined, FileTextOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getAllPosts, getPostContent, updatePost, createPost, uploadPostFile, deletePost, renamePost } from '../services/post'
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
	'---\n\n' +
	'# 未命名文章\n'

// 文章列表
function PostList() {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [posts, setPosts] = useState<string[]>([])
	const [pageNum, setPageNum] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [pageTotal, setPageTotal] = useState(0)

	const getPosts = async (num: number, size: number) => {
		try {
			setLoading(true)
			const res = await getAllPosts(num, size)
			if (res.success) {
				setPosts(res.data?.posts || [])
				setPageTotal(res.data?.total || 0)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	const removePost = async (filename: string) => {
		try {
			setLoading(true)
			const res = await deletePost(filename)
			if (res.success) {
				message.success('删除成功')
				const remainTotal = res.data?.total || 0
				const newTotalPages = Math.max(1, Math.ceil(remainTotal / pageSize))
				const newPageNum = Math.min(newTotalPages, pageNum)
				await getPosts(newPageNum, pageSize)
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	const uploadPost = async (file: File) => {
		try {
			setLoading(true)
			const res = await uploadPostFile(file)
			if (res.success) {
				message.success('上传成功')
				await getPosts(pageNum, pageSize)
			}
		} catch {
		} finally {
			setLoading(false)
		}
		return false
	}

	const onPageChange = async (num: number, size: number) => {
		setPageNum(num)
		setPageSize(size)
		await getPosts(num, size)
	}

	// 初始化
	useEffect(() => {
		getPosts(1, 12)
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
					<Tooltip title="编辑" placement="bottom">
						<Button loading={loading} type="link" icon={<EditOutlined />} onClick={() => navigate(`/post/edit/${filename}`)} />
					</Tooltip>
					<Tooltip title="查看" placement="bottom">
						<Button loading={loading} type="link" icon={<EyeOutlined />} onClick={() => navigate(`/post/view/${filename}`)} />
					</Tooltip>
					<Popconfirm title="确定删除？" onConfirm={() => removePost(filename)}>
						<Tooltip title="删除" placement="bottom">
							<Button loading={loading} type="link" danger icon={<DeleteOutlined />} />
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
			style={{ width: '100%', height: '100vh', overflowY: 'auto' }}
			extra={
				<Space.Compact style={{ marginLeft: 10 }}>
					<Upload showUploadList={false} beforeUpload={uploadPost} accept=".md">
						<Button loading={loading} icon={<UploadOutlined />}>
							上传
						</Button>
					</Upload>
					<Button loading={loading} type="primary" icon={<PlusOutlined />} onClick={() => navigate('/post/edit/new')}>
						新建
					</Button>
				</Space.Compact>
			}
		>
			<Table
				style={{ width: '100%' }}
				loading={loading}
				rowKey={(record) => record}
				dataSource={posts}
				columns={columns}
				pagination={{
					size: 'small',
					showQuickJumper: true,
					showSizeChanger: true,
					placement: ['bottomCenter'],
					pageSize: pageSize,
					current: pageNum,
					total: pageTotal,
					pageSizeOptions: [12, 24],
					onChange: onPageChange,
					showTotal: (total) => <span style={{ fontSize: 13 }}>共 {total} 篇</span>,
					style: { margin: '30px auto', whiteSpace: 'nowrap' }
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
	const navigate = useNavigate()
	const { isEditing = false } = props
	const { filename = 'new' } = useParams()
	const [content, setContent] = useState(POST_FRONT_MATTER)
	const [loading, setLoading] = useState(false)
	const [showReload, setShowReload] = useState(false)
	const db = usePostContentDB()
	const isNewRef = useRef<boolean>(filename === 'new') // 是否为新建
	const cacheKeyRef = useRef<string>(isNewRef.current ? 'new' : filename) // 当前缓存键
	const filenameRef = useRef<string>(filename) // 当前文件名
	const isEditingRef = useRef<boolean>(isEditing) // 是否为编辑模式

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

	// 清空草稿,恢复成默认模板
	const _restoreDraft = useCallback(async (id: number | string) => {
		await db.saveCache(id, POST_FRONT_MATTER) // 设为默认元数据头
	}, [])

	// 重载内容
	const reloadContent = useCallback(async () => {
		if (!isNewRef.current) {
			await getContent()
			await db.clearCache(cacheKeyRef.current)
		} else {
			setContent(POST_FRONT_MATTER)
			await _restoreDraft(cacheKeyRef.current)
		}
		setShowReload(false)
	}, [getContent, _restoreDraft])

	const _updateEditFilename = useCallback((newFilename: string) => {
		navigate(`/post/edit/${newFilename}`, { replace: true })
		isNewRef.current = false
		cacheKeyRef.current = newFilename
		filenameRef.current = newFilename
	}, [])

	// 保存
	const _handleSave = useCallback(async () => {
		if (loading || !isEditingRef.current) return
		try {
			setLoading(true)
			if (isNewRef.current) {
				const match = content.match(/^#\s+(.+)$/m)
				// ["# (标题)" 或 未命名文章]-YYYY-MM-DD_hh:mm:ss
				const newFilename = `${match?.[1].trim().replace(/[\\/:*?"<>|]/g, '_') || '未命名文章'}_${new Date().toISOString().slice(0, 19).replace(/\:/g, '-').replace('T', '_')}.md`
				const res = await createPost(newFilename, content)
				if (res.success) {
					await _restoreDraft('new') // new缓存恢复默认模板
					const createdFilename = res.data?.filename
					if (createdFilename) {
						_updateEditFilename(createdFilename)
					} else throw new Error('未从响应中获取到创建的文件名')
					message.success('创建成功')
				}
			} else {
				const res = await updatePost(filenameRef.current, content)
				if (res.success) {
					await db.clearCache(cacheKeyRef.current) // 清空缓存
					message.success('保存成功')
				}
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [content, reloadContent, _restoreDraft, _updateEditFilename])
	const throttledSave = useMemo(() => throttle(_handleSave, 2000, { immediate: true }), [_handleSave])

	// 保存草稿
	const _saveDraft = useCallback(async (content: string) => {
		if (!isEditingRef.current) return
		await db.saveCache(cacheKeyRef.current, content)
		setShowReload(true)
	}, [])
	const debouncedSaveDraft = useMemo(() => debounce(_saveDraft, 500), [_saveDraft])

	// 重命名
	const handleRename = async () => {
		try {
			setLoading(true)
			const newName = prompt('输入新名称')
			if (newName === null) return
			if (!newName?.trim()) {
				message.warning('新名称不能为空')
				return
			}
			const res = await renamePost(filenameRef.current, newName.trim())
			if (res.success) {
				message.success('重命名成功')
				const renamedFilename = res.data?.filename
				if (renamedFilename) {
					_updateEditFilename(renamedFilename)
				} else throw new Error('未从响应中获取到重命名后的新文件名')
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setContent(e.target.value)
		debouncedSaveDraft(e.target.value)
	}

	// 初始化
	useEffect(() => {
		db.getCache(cacheKeyRef.current).then((draft) => {
			if (draft) {
				// 判断是否为新建,新建用id为"new"的缓存,默认内容为POST_FRONT_MATTER
				if (isNewRef.current) {
					// 新建
					setContent(draft)
					if (draft !== POST_FRONT_MATTER) setShowReload(true)
				} else {
					// 修改
					if (draft === POST_FRONT_MATTER || !isEditingRef.current) {
						getContent() // 未修改则重新获取
					} else {
						setContent(draft) // 已修改则使用缓存
						setShowReload(true)
					}
				}
			} else {
				// 无缓存直接获取
				getContent()
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
						<Space.Compact>
							{!isNewRef.current && (
								<Button loading={loading} onClick={handleRename}>
									重命名
								</Button>
							)}
							<Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={throttledSave}>
								保存
							</Button>
						</Space.Compact>
					</>
				)
			}
		>
			<Spin spinning={loading}>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
					<Typography.Text type="secondary">{filenameRef.current}</Typography.Text>
					{isEditingRef.current && showReload && (
						<Popconfirm title={isNewRef.current ? '确定要恢复为新建的默认内容？' : '确定要重载为最新内容？'} onConfirm={reloadContent}>
							<Button loading={loading} size="small" icon={<ReloadOutlined />}>
								{isNewRef.current ? '恢复默认' : '内容重载'}
							</Button>
						</Popconfirm>
					)}
				</div>
				<Input.TextArea
					readOnly={!isEditingRef.current}
					value={content}
					onChange={onChange}
					autoSize={{ minRows: 25 }}
					style={{ fontFamily: 'monospace', maxHeight: 'calc(100vh - 139px)' }}
					placeholder={isEditing ? POST_FRONT_MATTER : '还没有任何内容哦~'}
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
