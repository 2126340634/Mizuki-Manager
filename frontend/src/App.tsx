import React, { useCallback, useEffect, useState } from 'react'
import { Routes } from 'react-router-dom'
import { createRoute } from './routes/createRoute'
import routes from './routes/routes'
import SidebarMenu from './components/SidebarMenu'
import './styles/App.scss'

export default function App() {
	const [screenWidth, setScreenWidth] = useState(window.innerWidth)
	const handleResize = useCallback(() => {
		setScreenWidth(window.innerWidth)
		console.log(window.innerWidth)
	}, [])
	useEffect(() => {
		// 响应式显示侧边栏
		window.addEventListener('resize', handleResize)
		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [])
	return (
		<div className="App">
			{screenWidth >= 768 ? <SidebarMenu /> : ''}
			<Routes>{createRoute(routes)}</Routes>
		</div>
	)
}
