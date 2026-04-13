import React from 'react'
import { Navigate } from 'react-router-dom'
import Index from '../pages'
export default [
	{
		path: '/',
		element: <Navigate to="/index" replace />
	},
	{
		path: '/index',
		element: <Index />
	},
	{
		path: '*',
		element: <div>404 页面不存在</div>
	}
]
