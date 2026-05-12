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
const Skill = lazy(() => import('../pages/skill'))
const Timeline = lazy(() => import('../pages/timeline'))
const Music = lazy(() => import('../pages/music'))
const Post = lazy(() => import('../pages/post'))

const lazyLoad = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => {
	return (
		<Suspense fallback={<div>加载中...</div>}>
			<Component></Component>
		</Suspense>
	)
}

export interface RouteItem {
	path: string
	element: React.ReactNode
	children?: RouteItem[]
	needAuth?: boolean
}

const routes: RouteItem[] = [
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
		element: lazyLoad(Index),
		needAuth: true
	},
	{
		path: '/about',
		element: lazyLoad(About),
		needAuth: true
	},
	{
		path: '/album',
		element: lazyLoad(Album),
		needAuth: true
	},
	{
		path: '/anime',
		element: lazyLoad(Anime),
		needAuth: true
	},
	{
		path: '/builder',
		element: lazyLoad(Builder),
		needAuth: true
	},
	{
		path: '/config',
		element: lazyLoad(Config),
		needAuth: true
	},
	{
		path: '/device',
		element: lazyLoad(Device),
		needAuth: true
	},
	{
		path: '/diary',
		element: lazyLoad(Diary),
		needAuth: true
	},
	{
		path: '/friend',
		element: lazyLoad(Friend),
		needAuth: true
	},
	{
		path: '/project',
		element: lazyLoad(Project),
		needAuth: true
	},
	{
		path: '/skill',
		element: lazyLoad(Skill),
		needAuth: true
	},
	{
		path: '/timeline',
		element: lazyLoad(Timeline),
		needAuth: true
	},
	{
		path: '/music',
		element: lazyLoad(Music),
		needAuth: true
	},
	{
		path: '/post/*',
		element: lazyLoad(Post),
		needAuth: true
	},
	{
		path: '*',
		element: <div>404 页面不存在</div>
	}
]

export const routePaths = [...routes.map((route) => route.path), '/post']

export default routes
