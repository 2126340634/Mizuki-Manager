import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Col, Row, Typography, ColorPicker, Descriptions, Button, Popconfirm } from 'antd'
import { DesktopOutlined, LogoutOutlined } from '@ant-design/icons'
import styles from '../styles/pages/index.module.scss'
import { managerList } from '../configs/managerConfig'
import { useDispatch } from 'react-redux'
import { AppDispatch, updateSelect } from '../stores'
import { defaultTheme, themes } from '../configs/styleConfig'
import { useGlobalContext } from '../hooks/useGlobalContext'
import { getSystemInfo } from '../services/system'
import { formatBytes, formatUptime, redirectToLogin } from '../utils/util'

export default function Index() {
	const { onNotify } = useGlobalContext()
	const [color, setColor] = useState(defaultTheme)
	const [systemInfo, setSystemInfo] = useState<Record<string, any>>()
	const nav = useNavigate()
	const dispatch = useDispatch<AppDispatch>()
	const timer = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		// 加载主题颜色
		const localColor = localStorage.getItem('color_rgb')
		if (localColor) {
			setColor(localColor)
			onNotify({ theme: localColor })
		}
		// 获取服务器配置
		InitSystemInfo()
		// 轮询更新
		timer.current = setInterval(() => {
			InitSystemInfo()
		}, 30000) // 每30秒更新一次
		return () => {
			if (timer.current !== null) {
				clearInterval(timer.current)
				timer.current = null
			}
		}
	}, [])

	// 获取服务器配置
	const InitSystemInfo = async () => {
		try {
			const res = await getSystemInfo()
			setSystemInfo(res.data)
		} catch (err) {
			console.error('获取服务器配置失败')
		}
	}

	const updateColor = useCallback((color: any) => {
		const { r, g, b } = color.metaColor
		setColor(`rgb(${r}, ${g}, ${b})`)
		localStorage.setItem('color_rgb', `rgb(${r}, ${g}, ${b})`)
		onNotify({ theme: `rgb(${r}, ${g}, ${b})` })
	}, [])

	return (
		<div className={styles.container}>
			<Typography.Title level={1} className={styles.title} style={{ color }}>
				MIZUKI MANAGER
				<ColorPicker
					className={styles['color-picker']}
					size="small"
					format="rgb"
					value={color}
					presets={[
						{ label: '默认主题', colors: [defaultTheme] },
						{ label: '预设主题', colors: themes }
					]}
					disabledAlpha
					disabledFormat
					onChangeComplete={updateColor}
					destroyOnHidden
				/>
			</Typography.Title>
			<Typography.Title level={5} className={styles.subtitle}>
				Mizuki 博客管理器
			</Typography.Title>
			<Row gutter={[8, 8]}>
				{managerList
					.filter((item) => !item.hidden)
					.map((item) => (
						<Col xs={12} sm={8} md={6} lg={4} key={item.title}>
							<Card
								hoverable
								onClick={() => {
									nav(item.path as string)
									dispatch(updateSelect(item.path))
								}}
								className={styles.card}
							>
								<div className={styles['card-icon']} style={{ color }}>
									{item.icon}
								</div>
								<div className={styles['card-title']}>{item.title}</div>
								<div className={styles['card-subtitle']}>{item.subtitle}</div>
							</Card>
						</Col>
					))}
			</Row>
			{systemInfo && (
				<Card
					title={
						<span style={{ fontWeight: 500 }}>
							<DesktopOutlined /> 服务器配置
						</span>
					}
					style={{ marginTop: 16 }}
				>
					<Descriptions
						column={{ xs: 1, sm: 2, lg: 3 }}
						size="small"
						items={[
							{ key: 'hostname', label: '主机名', children: systemInfo.hostname },
							{ key: 'platform', label: '平台', children: systemInfo.platform },
							{ key: 'arch', label: '架构', children: systemInfo.arch },
							{
								key: 'os',
								label: '系统版本',
								children: `${systemInfo.type ?? ''} ${systemInfo.release ?? ''}`.trim()
							},
							{
								key: 'cpus',
								label: 'CPU 核心数',
								children: Array.isArray(systemInfo.cpus) ? systemInfo.cpus.length : '-'
							},
							{ key: 'total', label: '总内存', children: formatBytes(systemInfo.totalMemory) },
							{ key: 'free', label: '空闲内存', children: formatBytes(systemInfo.freeMemory) },
							{ key: 'uptime', label: '运行时间', children: formatUptime(systemInfo.uptime) },
							{
								key: 'loadAvg',
								label: '系统负载',
								children: Array.isArray(systemInfo.loadAvg) ? systemInfo.loadAvg.map((v: number) => v.toFixed(2)).join(' / ') : '-'
							}
						]}
					/>
				</Card>
			)}
			<Popconfirm title="确定要退出登录吗？" okText="确定" cancelText="取消" onConfirm={redirectToLogin} placement="bottom">
				<Button type="text" danger icon={<LogoutOutlined />} className={styles['logout-button']}>
					退出登录
				</Button>
			</Popconfirm>
		</div>
	)
}
