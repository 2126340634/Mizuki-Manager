import React, { useCallback, useEffect, useState } from 'react'
import { Card, Col, Row, Typography, ColorPicker } from 'antd'
import styles from '../styles/pages/index.module.scss'
import { managerList } from '../configs/managerConfig'
import SidebarMenu from '../components/SidebarMenu'

export default function Index() {
	const [color, setColor] = useState('#1890ff')
	const [screenWidth, setScreenWidth] = useState(window.innerWidth)
	const handleResize = useCallback(() => {
		setScreenWidth(window.innerWidth)
		console.log(window.innerWidth)
	}, [])
	useEffect(() => {
		console.log('组件初始化')
		// 加载主题颜色
		const localColor = localStorage.getItem('color_rgb')
		if (localColor) setColor(localColor)
		// 响应式显示侧边栏
		window.addEventListener('resize', handleResize)
		return () => {
			window.removeEventListener('resize', handleResize)
			console.log('组件清理')
		}
	}, [])
	function updateColor(color: any) {
		const { r, g, b } = color.metaColor
		setColor(`rgb(${r}, ${g}, ${b})`)
		localStorage.setItem('color_rgb', `rgb(${r}, ${g}, ${b})`)
	}
	return (
		<div className={styles.container}>
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				{screenWidth >= 768 ? <SidebarMenu /> : ''}
				<div>
					<Typography.Title level={1} className={styles.title}>
						MIZUKI MANAGER
						<ColorPicker className={styles['color-picker']} format="rgb" value={color || '#1890ff'} disabledAlpha disabledFormat onChangeComplete={updateColor} />
					</Typography.Title>
					<Typography.Title level={5} className={styles.subtitle}>
						Mizuki 博客后台管理
					</Typography.Title>

					<Row gutter={[8, 8]}>
						{managerList.map((item) => (
							<Col xs={12} sm={8} md={6} lg={4} key={item.title}>
								<Card hoverable onClick={() => console.log(item.title)} className={styles.card}>
									<div className={styles['card-icon']} style={{ color }}>
										{item.icon}
									</div>
									<div className={styles['card-title']}>{item.title}</div>
									<div className={styles['card-subtitle']}>{item.subtitle}</div>
								</Card>
							</Col>
						))}
					</Row>
				</div>
			</div>
		</div>
	)
}
