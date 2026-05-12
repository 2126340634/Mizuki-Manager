import React, { useState } from 'react'
import { Routes, useLocation } from 'react-router-dom'
import { createRoute } from './routes/createRoute'
import routes, { routePaths } from './routes/routes'
import SidebarMenu from './components/SidebarMenu'
import './styles/App.scss'
import { Button, Drawer, Grid } from 'antd'
import { MenuUnfoldOutlined } from '@ant-design/icons'
import Sider from 'antd/es/layout/Sider'
import Support from './components/Support'

export default function App() {
	const { useBreakpoint } = Grid
	const [drawerVisible, setDrawerVisible] = useState(false)
	const screens = useBreakpoint()
	const location = useLocation()
	const handleMenuClick = () => setDrawerVisible(false)
	// 条件渲染侧边栏
	const shouldShowSidebar = (path: string) => {
		if (path === '/login') return false
		return routePaths.some((p) => p === path || path.startsWith(`${p}/`))
	}
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
					<Drawer title="功能导航" placement="left" onClose={() => setDrawerVisible(false)} open={drawerVisible} size="fit-content" styles={{ body: { padding: 0, margin: 0 } }}>
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
