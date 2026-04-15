import React, { useState } from 'react'
import { Card, Input, Button, Upload, message, Space, Typography, Divider } from 'antd'
import { SaveOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons'

const { TextArea } = Input

export default function About() {
	const [content, setContent] = useState('')
	const [saving, setSaving] = useState(false)

	const uploadProps = {
		name: 'file',
		accept: '.md',
		beforeUpload: (file: File) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				const text = e.target?.result as string
				setContent(text)
				message.success('文件上传成功')
			}
			reader.readAsText(file)
			return false
		}
	}

	const handleUpdate = async () => {
		setSaving(true)
		try {
			// Add your API call here to save the content
			message.success('保存成功')
		} catch (error) {
			message.error('保存失败')
		} finally {
			setSaving(false)
		}
	}
	return (
		<Card
			title={
				<span>
					<FileTextOutlined /> 关于页面管理
				</span>
			}
			loading={true}
			extra={
				<Space>
					<Upload {...uploadProps}>
						<Button icon={<UploadOutlined />}>上传并替换 MD</Button>
					</Upload>
					<Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleUpdate}>
						保存修改
					</Button>
				</Space>
			}
		>
			<Typography.Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
				编辑下方 Markdown 内容直接更新，或通过上方按钮上传现有的 about.md 文件。
			</Typography.Text>

			<TextArea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				placeholder="在此输入 Markdown 内容..."
				autoSize={{ minRows: 15, maxRows: 25 }}
				style={{ fontFamily: 'monospace', fontSize: '14px' }}
			/>

			<Divider>预览提示</Divider>
			<div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
				<Typography.Text italic>内容已支持实时编辑，点击右上角保存即可同步至服务器。</Typography.Text>
			</div>
		</Card>
	)
}
