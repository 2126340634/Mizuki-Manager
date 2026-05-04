import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import store from './stores'
import { Provider } from 'react-redux'
import './styles/index.scss'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppContext from './hooks/useGlobalContext'
import { defaultTheme } from './configs/styleConfig'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')
const root = ReactDOM.createRoot(rootElement)

const Root: React.FC = () => {
	const [theme, setTheme] = useState(() => localStorage.getItem('color_rgb') || defaultTheme)
	const onNotify = (data: any) => {
		if (data?.theme) setTheme(data.theme)
	}
	return (
		<React.StrictMode>
			<ConfigProvider
				locale={zhCN}
				theme={{
					token: { colorPrimary: theme }
				}}
			>
				<AppContext.Provider value={{ onNotify }}>
					<BrowserRouter>
						<Provider store={store}>
							<App />
						</Provider>
					</BrowserRouter>
				</AppContext.Provider>
			</ConfigProvider>
		</React.StrictMode>
	)
}

root.render(<Root />)
