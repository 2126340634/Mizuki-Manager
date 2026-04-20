import React, { useState, useEffect, useCallback } from 'react'
import { Card, Input, Button, Upload, message, Space, Typography, Spin } from 'antd'
import { SaveOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons'
import { getAboutContent, updateAboutContent, replaceAboutFile } from '../services/about'

export default function About() {
	const [content, setContent] = useState('')
	const [loading, setLoading] = useState(false)

	// 获取内容
	const getContent = async () => {
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
	}

	useEffect(() => {
		getContent()
	}, [])

	// 更新内容
	const handleUpdate = async () => {
		try {
			setLoading(true)
			const res = await updateAboutContent(content)
			if (res.success) {
				message.success('保存成功')
				await getContent()
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	// 替换文件
	const handleReplace = async (file: File) => {
		try {
			setLoading(true)
			const res = await replaceAboutFile(file)
			if (res.success) {
				message.success('替换成功')
				await getContent()
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	return (
		<Card
			title={
				<span>
					<FileTextOutlined /> 编辑关于页面
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
					<Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleUpdate}>
						保存
					</Button>
				</Space>
			}
		>
			<Spin spinning={loading}>
				<Typography.Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
					编辑 Markdown 源码或上传文件覆盖：
				</Typography.Text>
				<Input.TextArea value={content} onChange={(e) => setContent(e.target.value)} autoSize={{ minRows: 15 }} style={{ fontFamily: 'monospace', maxHeight: 'calc(100vh - 139px)' }} />
			</Spin>
		</Card>
	)
}
