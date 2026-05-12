import React from 'react'
import { Navigate } from 'react-router-dom'

// 路由守卫
export function PrivateRoute({ element }: { element: React.ReactNode }) {
	const token = localStorage.getItem('token') || sessionStorage.getItem('token')
	if (!token) return <Navigate to="/login" replace />
	return element
}
    