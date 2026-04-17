import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Col, Row, Typography, ColorPicker } from 'antd'
import styles from '../styles/pages/index.module.scss'
import { managerList } from '../configs/managerConfig'
import { useDispatch } from 'react-redux'
import { AppDispatch, updateSelect } from '../stores'
import { defaultTheme } from '../configs/styleConfig'

export default function Index() {
	const [color, setColor] = useState(defaultTheme)
	const nav = useNavigate()
	const dispatch = useDispatch<AppDispatch>()
	useEffect(() => {
		// 加载主题颜色
		const localColor = localStorage.getItem('color_rgb')
		if (localColor) setColor(localColor)
	}, [])
	const updateColor = useCallback((color: any) => {
		const { r, g, b } = color.metaColor
		setColor(`rgb(${r}, ${g}, ${b})`)
		localStorage.setItem('color_rgb', `rgb(${r}, ${g}, ${b})`)
	}, [])
	return (
		<div className={styles.container}>
			<Typography.Title level={1} className={styles.title}>
				MIZUKI MANAGER
				<ColorPicker className={styles['color-picker']} size="small" format="rgb" value={color || defaultTheme} disabledAlpha disabledFormat onChangeComplete={updateColor} />
			</Typography.Title>
			<Typography.Title level={5} className={styles.subtitle}>
				Mizuki 博客后台管理
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
		</div>
	)
}
