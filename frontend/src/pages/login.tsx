import React, { useCallback, useEffect, useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/pages/login.module.scss'
import { login } from '../services/auth'
import { defaultTheme } from '../configs/styleConfig'

interface LoginInput {
	username: string
	password: string
	remember: boolean
}

const { Title, Text } = Typography

export default function Login() {
	const [loading, setLoading] = useState(false)
	const nav = useNavigate()
	const themeColor = localStorage.getItem('color_rgb') || defaultTheme
	const onFinish = useCallback(async (values: LoginInput) => {
		try {
			setLoading(true)
			const res = await login(values)
			const { remember } = values
			const token = res.data.token
			if (token) {
				sessionStorage.setItem('token', token)
				if (remember) localStorage.setItem('token', token)
			} else throw new Error('未从登录响应中获取凭证信息')
			nav('/')
			message.success('欢迎回来')
		} catch {
		} finally {
			setLoading(false)
		}
	}, [])

	return (
		<div className={styles.loginContainer}>
			<Card className={styles.loginCard}>
				<div className={styles.header}>
					<Title level={2} style={{ color: themeColor, fontWeight: 800 }}>
						MIZUKI MANAGER
					</Title>
					<Text type="secondary">Mizuki 博客后台管理</Text>
				</div>

				<Form onFinish={onFinish} size="large" initialValues={{ remember: false }} autoComplete="off">
					<Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
						<Input autoComplete="off" prefix={<UserOutlined style={{ color: themeColor }} />} placeholder="用户名" />
					</Form.Item>

					<Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
						<Input.Password autoComplete="off" prefix={<LockOutlined style={{ color: themeColor }} />} placeholder="密码" />
					</Form.Item>

					<Form.Item>
						<div className={styles.options}>
							<Form.Item name="remember" valuePropName="checked" noStyle>
								<Checkbox>记住我</Checkbox>
							</Form.Item>
							<a style={{ color: themeColor }} onClick={() => message.warning('默认账号密码可在项目根目录的 .env 文件中更改')}>
								忘记密码？
							</a>
						</div>
					</Form.Item>

					<Form.Item>
						<Button type="primary" htmlType="submit" block loading={loading} className={styles.submitBtn} style={{ backgroundColor: themeColor, borderColor: themeColor }}>
							登 录
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</div>
	)
}
