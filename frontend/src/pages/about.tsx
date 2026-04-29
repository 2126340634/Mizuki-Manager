import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, Input, Button, Upload, message, Space, Typography, Spin, Popconfirm } from 'antd'
import { SaveOutlined, UploadOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { getAboutContent, updateAboutContent, replaceAboutFile } from '../services/about'
import { debounce } from '../utils/util'
import { useAboutContentDB } from '../hooks/useAboutContentDB'

export default function About() {
	const [content, setContent] = useState('')
	const [loading, setLoading] = useState(false)
	const [showReload, setShowReload] = useState(false)
	const db = useAboutContentDB()

	// 获取内容
	const getContent = useCallback(async () => {
		try {
			setLoading(true)
			const res = await getAboutContent()
			const data = res.data
			if (data) setContent(data)
			else throw new Error('未从响应中获取到About内容')
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	// 初始化
	useEffect(() => {
		// 优先回显本地草稿
		db.getCache().then((draft) => {
			if (draft) {
				setContent(draft)
				setShowReload(true)
			} else {
				getContent()
			}
		})
	}, [])

	// 重载内容
	const reloadContent = useCallback(async () => {
		await getContent()
		await db.clearCache()
		setShowReload(false)
	}, [getContent, db])

	// 更新内容
	const _handleUpdate = useCallback(async () => {
		if (loading) return
		try {
			setLoading(true)
			const res = await updateAboutContent(content)
			if (res.success) {
				message.success('保存成功')
				await reloadContent()
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}, [reloadContent, content])
	const debouncedUpdate = useMemo(() => debounce(_handleUpdate, 2000, { immediate: true }), [_handleUpdate])

	// 替换文件
	const handleReplace = async (file: File) => {
		if (loading) return
		try {
			setLoading(true)
			const res = await replaceAboutFile(file)
			if (res.success) {
				message.success('替换成功')
				await reloadContent()
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	// 输入保存草稿
	const _saveDraft = useCallback(
		async (content: string) => {
			if (!content) return
			await db.saveCache(content)
			setShowReload(true)
		},
		[db]
	)
	const debouncedSaveDraft = useMemo(() => debounce(_saveDraft, 500), [_saveDraft])

	const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setContent(e.target.value)
		debouncedSaveDraft(e.target.value)
	}

	return (
		<Card
			title={
				<span style={{ marginLeft: 24 }}>
					<FileTextOutlined /> 关于页面
				</span>
			}
			style={{ width: '100%' }}
			extra={
				<Space style={{ marginLeft: 10 }}>
					<Upload showUploadList={false} beforeUpload={handleReplace}>
						<Button loading={loading} icon={<UploadOutlined />}>
							上传替换
						</Button>
					</Upload>
					<Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={debouncedUpdate}>
						保存
					</Button>
				</Space>
			}
		>
			<Spin spinning={loading}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
					<Typography.Text type="secondary">编辑 Markdown 文档</Typography.Text>
					{showReload && (
						<Popconfirm title="确定将当前草稿重载为原有文档内容?" okText="确定" cancelText="取消" onConfirm={reloadContent} placement="bottom">
							<Button size="small" icon={<ReloadOutlined />} loading={loading}>
								内容重载
							</Button>
						</Popconfirm>
					)}
				</div>
				<Input.TextArea value={content} onChange={onInputChange} autoSize={{ minRows: 15 }} style={{ fontFamily: 'monospace', maxHeight: 'calc(100vh - 139px)' }} />
			</Spin>
		</Card>
	)
}
