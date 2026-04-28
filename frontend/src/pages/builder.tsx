import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Layout, Typography, Grid, Space, Button, Alert, Empty, Popconfirm, message } from 'antd'
import { RocketOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import styles from '../styles/pages/builder.module.scss'
import { deployProjectSSE, stopDeployProcess, syncDeployStatus } from '../services/builder'
import Convert from 'ansi-to-html'
import { useBuilderLogDB } from '../hooks/useBuilderLogDB'
import { throttle } from '../utils/util'

const convert = new Convert({
	fg: '#999',
	bg: '#2a2a2a',
	newline: false,
	escapeXML: true,
	stream: true
})
const { Content } = Layout
const { useBreakpoint } = Grid
const LOG_MAX_LENGTH = 100000 // 最长保留100000字符

export default function Builder() {
	const screens = useBreakpoint()
	const logDB = useBuilderLogDB()
	const [loading, setLoading] = useState(false)
	const [log, setLog] = useState<string>('')
	const logEndRef = useRef<HTMLDivElement>(null)
	const ctrlRef = useRef<AbortController>(null)
	const inited = useRef<boolean>(false) // 是否已初始化
	const hasSynced = useRef<boolean>(false) // 是否已同步服务器部署状态

	const renderedLog = useMemo(() => {
		if (!log) return ''
		return convert.toHtml(log)
	}, [log])

	const scrollToBottom = useCallback(() => {
		logEndRef?.current?.scrollIntoView()
	}, [])

	const throttledSaveLog = useMemo(() => throttle(logDB.saveCache, 1000), [logDB])

	// 监听log变化
	useEffect(() => {
		scrollToBottom()
		if (inited.current) {
			throttledSaveLog(log)
			// 同步当前服务器部署状态
			if (!hasSynced.current) {
				hasSynced.current = true
				ctrlRef?.current?.abort() // 断开旧连接
				ctrlRef.current = syncDeployStatus(_sseCallback)
			}
		}

		return () => {
			if (inited.current) {
				logDB.saveCache(log) // 卸载前保存
			}
		}
	}, [log, scrollToBottom, throttledSaveLog])

	const _sseCallback = {
		onMessage: (data: any) => {
			setLoading(true)
			// 如果接收的为历史日志，则清空上文重新输出
			const newLog = data.log || ''
			if (data?.isHistory) {
				setLog(newLog || '')
			} else {
				setLog((prev) => {
					const next = prev + (newLog || '')
					if (next.length > LOG_MAX_LENGTH) {
						return next.slice(-LOG_MAX_LENGTH)
					}
					return next
				})
			}
		},
		onDone: (data: any) => {
			if (data?.message) setLog((prev) => prev + data.message)
			setLoading(false)
		},
		onError: (err: any) => {
			setLog((prev) => prev + (err?.message || `\n[Error] ${err}\n`)) // 恢复之前的日志
			setLoading(false)
			console.error(err)
		}
	}

	// 启动部署
	const handleDeploy = () => {
		if (loading) return
		ctrlRef?.current?.abort()
		ctrlRef.current = deployProjectSSE(_sseCallback)
	}

	// 清除日志数据库
	const clearLogCache = async () => {
		setLog('')
		const res = await logDB.clearCache()
		if (res) message.success('已清空日志缓存')
		else message.error('清空失败')
	}

	// 取消部署
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

	// 初始化
	useEffect(() => {
		logDB
			.getCache()
			.then((savedLog) => {
				setLog(savedLog || '')
			})
			.finally(() => {
				inited.current = true
			})

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
						<Popconfirm placement="bottom" title="确定清空日志吗？" okText="确定" cancelText="取消" onConfirm={clearLogCache}>
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
