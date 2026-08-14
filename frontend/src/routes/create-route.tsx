import { Route } from 'react-router-dom'
import React from 'react'
import { RouteItem } from './routes'
import { PrivateRoute } from '../components/PrivateRoute'

export function createRoute(routes: RouteItem[]) {
	return routes.map((item) => {
		// 验证登录
		const element = item.needAuth ? <PrivateRoute {...item} /> : item.element
		// 子路由
		if (item.children && item.children.length) return <Route key={item.path}>{createRoute(item.children)}</Route>

		return <Route key={item.path} path={item.path} element={element} />
	})
}
