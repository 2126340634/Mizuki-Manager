import React, { useCallback, useEffect, useState } from 'react'
import { Routes, useLocation, useNavigate } from 'react-router-dom'
import { createRoute } from './routes/createRoute'
import routes from './routes/routes'
import SidebarMenu from './components/SidebarMenu'
import './styles/App.scss'
import { Button, Drawer, Grid } from 'antd'
import { MenuUnfoldOutlined } from '@ant-design/icons'
import Sider from 'antd/es/layout/Sider'

export default function App() {
	const { useBreakpoint } = Grid
	const [drawerVisible, setDrawerVisible] = useState(false)
	const screens = useBreakpoint()
	const location = useLocation()
	const token = localStorage.getItem('token') || sessionStorage.getItem('token')
	const nav = useNavigate()
	const handleMenuClick = useCallback(() => {
		setDrawerVisible(false)
	}, [])
	useEffect(() => {
		// 登录路由守卫
		if (!token && location.pathname === '/index') {
			nav('/login', { replace: true })
		}
	}, [location.pathname, token])
	return (
		<div className="App" style={{ maxWidth: location.pathname !== '/login' ? '1600px' : '', margin: '0 auto' }}>
			{/* PC侧边栏 */}
			{location.pathname !== '/login' &&
				(screens.md ? (
					<Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
						<SidebarMenu menuClick={handleMenuClick} />
					</Sider>
				) : (
					/* 移动端 */
					<Drawer title="功能导航" placement="left" onClose={() => setDrawerVisible(false)} open={drawerVisible} size="fit-content" styles={{ body: { padding: 0, margin: 0 } }}>
						<SidebarMenu menuClick={handleMenuClick} />
					</Drawer>
				))}
			{/*  菜单展开按钮 */}
			{!screens.md && location.pathname !== '/login' && <Button style={{ position: 'fixed', zIndex: 1000, left: 8, top: 8 }} icon={<MenuUnfoldOutlined />} onClick={() => setDrawerVisible(true)} />}
			{/* 路由 */}
			<Routes>{createRoute(routes)}</Routes>
		</div>
	)
}
