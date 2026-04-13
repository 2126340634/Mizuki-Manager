import React from 'react'
import { Routes } from 'react-router-dom'
import { createRoute } from './routes/createRoute'
import routes from './routes/routes'

export default function App() {
	return (
		<div className="App">
			<Routes>{createRoute(routes)}</Routes>
		</div>
	)
}
