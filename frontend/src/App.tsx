import React, { useEffect, useState } from 'react'
import { Routes, useLocation } from 'react-router-dom'
import { createRoute } from './routes/create-route'
import routes, { routePaths } from './routes/routes'
import SidebarMenu from './components/SidebarMenu'
import './styles/App.scss'
import { Button, Drawer, Grid } from 'antd'
import { MenuUnfoldOutlined } from '@ant-design/icons'
import Sider from 'antd/es/layout/Sider'
import Support from './components/Support'
import { checkSession, verifyToken } from './services/auth'
import { redirectToLogin } from './utils/util'
import { usePolling } from './hooks/usePolling'

export default function App() {
	const { useBreakpoint } = Grid
	const [drawerVisible, setDrawerVisible] = useState(false)
	const screens = useBreakpoint()
	const location = useLocation()
	const handleMenuClick = () => setDrawerVisible(false)
	// 轮询单点互踢
	const sessionPolling = usePolling(
		() => {
			checkSession().catch(async (err) => {
				if (err.code === 403) {
					// 多端登录
					alert(err.message || '当前会话已失效，请重新登录')
					await redirectToLogin()
				} else if (err.code === 601) {
					// 未登录停止轮询
					sessionPolling.stop()
				}
			})
		},
		60000,
		{ immediate: true }
	)

	// 条件渲染侧边栏
	const shouldShowSidebar = (path: string) => {
		if (path === '/login') return false
		return routePaths.some((p) => p === path || path.startsWith(`${p}/`))
	}

	useEffect(() => {
		const token = localStorage.getItem('token') || sessionStorage.getItem('token')
		if (token) verifyToken({ token }) // 首次进入检查token是否过期
	}, [])

	// 路由改变就重新启动轮询
	useEffect(() => {
		sessionPolling.start()
	}, [location.pathname])

	return (
		<div className="App" style={{ maxWidth: location.pathname !== '/login' ? '1600px' : '', margin: '0 auto' }}>
			{/* PC侧边栏 */}
			{shouldShowSidebar(location.pathname) &&
				(screens.md ? (
					<Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
						<SidebarMenu menuClick={handleMenuClick} />
					</Sider>
				) : (
					/* 移动端 */
					<Drawer
						title="功能导航"
						placement="left"
						onClose={() => setDrawerVisible(false)}
						open={drawerVisible}
						size="fit-content"
						styles={{ body: { padding: 0, margin: 0 } }}
					>
						<SidebarMenu menuClick={handleMenuClick} />
					</Drawer>
				))}
			{/*  菜单展开按钮 */}
			{!screens.md && shouldShowSidebar(location.pathname) && (
				<Button style={{ position: 'fixed', zIndex: 1000, left: 8, top: 8 }} icon={<MenuUnfoldOutlined />} onClick={() => setDrawerVisible(true)} />
			)}
			{/* 路由 */}
			<Routes>{createRoute(routes)}</Routes>

			<Support />
		</div>
	)
}
