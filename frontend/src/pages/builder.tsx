import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Layout, Typography, Grid, Space, Button, Alert, Empty, Popconfirm, message } from 'antd'
import { RocketOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import styles from '../styles/pages/builder.module.scss'
import { deployProjectSSE, stopDeployProcess } from '../services/builder'
import Convert from 'ansi-to-html'

const convert = new Convert({
	fg: '#999',
	bg: '#2a2a2a',
	newline: false,
	escapeXML: true,
	stream: true
})
const { Content } = Layout
const { useBreakpoint } = Grid

export default function Builder() {
	const screens = useBreakpoint()
	const [loading, setLoading] = useState(false)
	const [log, setLog] = useState<string>('')
	const logEndRef = useRef<HTMLDivElement>(null)
	const ctrlRef = useRef<AbortController>(null)

	const renderedLog = useMemo(() => {
		if (!log) return ''
		return convert.toHtml(log)
	}, [log])

	const scrollToBottom = useCallback(() => {
		logEndRef?.current?.scrollIntoView()
	}, [])

	// 自动滚动
	useEffect(() => {
		if (log.length > 0) scrollToBottom()
	}, [log, scrollToBottom])

	const handleDeploy = () => {
		if (loading) return
		const tmpLog = log // 缓存当前Log
		setLog('')
		setLoading(true)
		ctrlRef.current = deployProjectSSE({
			onMessage: (data: any) => setLog((prev) => prev + (data?.log || '')),
			onDone: () => setLoading(false),
			onError: (err: any) => {
				setLog(tmpLog) // 恢复之前的日志
				console.error(err)
				message.error(err.message || '启动部署失败')
				setLoading(false)
			}
		})
	}

	const cancelDeploy = async () => {
		try {
			setLoading(true)
			ctrlRef?.current?.abort()
			const res = await stopDeployProcess()
			if (res.success) {
				message.success('已停止部署')
				setLog((prev) => prev + '\n[System] 已终止部署子进程\n')
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		return () => {
			ctrlRef?.current?.abort()
		}
	}, [])

	return (
		<Layout className={styles['layout-container']}>
			<Content style={{ padding: screens.md ? '24px' : '8px', overflowY: 'auto' }}>
				{/* 顶部标题与操作栏 */}
				<div className={styles.toolbar}>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<Typography.Title level={4} style={{ margin: 0 }}>
							<RocketOutlined /> 构建部署
						</Typography.Title>
						<Typography.Text type="secondary">管理项目构建与生产环境发布</Typography.Text>
					</div>
				</div>

				<Alert style={{ marginBottom: 8 }} title="构建并同步资源时，请勿刷新或切换页面以免丢失日志。" type="info" showIcon closable />

				<Space style={{ float: 'right' }}>
					{log.length > 0 && (
						<Popconfirm placement="bottom" title="确定清空日志吗？" okText="确定" cancelText="取消" onConfirm={() => setLog('')}>
							<Button icon={<DeleteOutlined />} disabled={loading}>
								清空日志
							</Button>
						</Popconfirm>
					)}
					<Popconfirm placement="bottom" title="确定关闭部署进程吗？" description="如遇到进程执行异常等情况可关闭后重新部署" okText="确定" cancelText="取消" onConfirm={cancelDeploy}>
						<Button danger icon={<SyncOutlined />}>
							中断部署
						</Button>
					</Popconfirm>
					<Popconfirm placement="bottom" title="确定执行部署吗？" description="重新构建通常需要几十秒" okText="确定" cancelText="取消" onConfirm={handleDeploy}>
						<Button type="primary" icon={<SyncOutlined spin={loading} />} loading={loading}>
							一键部署
						</Button>
					</Popconfirm>
				</Space>

				{/* 日志输出区域 */}
				{log.length > 0 ? (
					<div className={styles['output-container']}>
						<div className={styles.log} dangerouslySetInnerHTML={{ __html: renderedLog }} />
						<div ref={logEndRef} className={styles['log-end']} />
					</div>
				) : (
					<Empty style={{ marginTop: 120 }} description="暂无构建日志，点击右上角“一键部署”开始" />
				)}
			</Content>
		</Layout>
	)
}
