import React, { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
const Login = lazy(() => import('../pages/login'))
const Index = lazy(() => import('../pages/index'))
const About = lazy(() => import('../pages/about'))
const Album = lazy(() => import('../pages/album'))
const Anime = lazy(() => import('../pages/anime'))
const Builder = lazy(() => import('../pages/builder'))
const Config = lazy(() => import('../pages/config'))
const Device = lazy(() => import('../pages/device'))
const Diary = lazy(() => import('../pages/diary'))
const Friend = lazy(() => import('../pages/friend'))
const Project = lazy(() => import('../pages/project'))

const lazyLoad = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => {
	return (
		<Suspense fallback={<div>加载中...</div>}>
			<Component></Component>
		</Suspense>
	)
}

const routes = [
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
		path: '/anime',
		element: lazyLoad(Anime)
	},
	{
		path: '/builder',
		element: lazyLoad(Builder)
	},
	{
		path: '/config',
		element: lazyLoad(Config)
	},
	{
		path: '/device',
		element: lazyLoad(Device)
	},
	{
		path: '/diary',
		element: lazyLoad(Diary)
	},
	{
		path: '/friend',
		element: lazyLoad(Friend)
	},
	{
		path: '/project',
		element: lazyLoad(Project)
	},
	{
		path: '*',
		element: <div>404 页面不存在</div>
	}
]

export const routePaths = new Set(routes.map((route) => route.path))

export default routes
