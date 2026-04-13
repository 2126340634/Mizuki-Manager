import { Route } from 'react-router-dom'
import React from 'react'

export function createRoute(routes: any[]) {
	return routes.map((item) => {
		if (item.children && item.children.length) return <Route key={item.path}>{createRoute(item.children)}</Route>
		return <Route key={item.path} path={item.path} element={item.element} />
	})
}
