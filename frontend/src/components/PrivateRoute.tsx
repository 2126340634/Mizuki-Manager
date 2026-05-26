import React from 'react'
import { Navigate } from 'react-router-dom'
import { RouteItem } from '../routes/routes'

// 路由守卫
export function PrivateRoute({ path, element }: RouteItem) {
	const token = localStorage.getItem('token') || sessionStorage.getItem('token')
	if (!token && path !== '/login') return <Navigate to="/login" replace />
	return element
}
