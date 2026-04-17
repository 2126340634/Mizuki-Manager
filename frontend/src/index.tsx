import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import store from './stores'
import { Provider } from 'react-redux'
import './styles/index.scss'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')
const root = ReactDOM.createRoot(rootElement)

root.render(
	<React.StrictMode>
		<ConfigProvider locale={zhCN}>
			<BrowserRouter>
				<Provider store={store}>
					<App />
				</Provider>
			</BrowserRouter>
		</ConfigProvider>
	</React.StrictMode>
)
