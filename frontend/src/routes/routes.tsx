import React from 'react'
import { Navigate } from 'react-router-dom'
import Login from '../pages/login'
import Index from '../pages'
import About from '../pages/about'
import Album from '../pages/album'
export default [
	{
		path: '/',
		element: <Navigate to="/index" replace />
	},
	{
		path: '/login',
		element: <Login />
	},
	{
		path: '/index',
		element: <Index />
	},
	{
		path: '/about',
		element: <About />
	},
	{
		path: '/album',
		element: <Album />
	},
	{
		path: '*',
		element: <div>404 页面不存在</div>
	}
]
