import React, { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
const Login = lazy(() => import('../pages/login'))
const Index = lazy(() => import('../pages/index'))
const About = lazy(() => import('../pages/about'))
const Album = lazy(() => import('../pages/album'))

const lazyLoad = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => {
	return (
		<Suspense fallback={<div>加载中...</div>}>
			<Component></Component>
		</Suspense>
	)
}

export default [
	{
		path: '/',
		element: <Navigate to="/index" replace />
	},
	{
		path: '/login',
		element: lazyLoad(Login)
	},
	{
		path: '/index',
		element: lazyLoad(Index)
	},
	{
		path: '/about',
		element: lazyLoad(About)
	},
	{
		path: '/album',
		element: lazyLoad(Album)
	},
	{
		path: '*',
		element: <div>404 页面不存在</div>
	}
]
