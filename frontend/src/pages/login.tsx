import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/pages/login.module.scss'
import { login, refreshCaptchaBase64 } from '../services/auth'
import { defaultTheme } from '../configs/styleConfig'

interface LoginInput {
	username: string
	password: string
	remember: boolean
	captcha?: string // 验证码
}

const { Title, Text } = Typography

export default function Login() {
	const [msgApi, msgContextHolder] = message.useMessage()
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const [captchaBase64, setCaptchaBase64] = useState('') // 验证码Base64
	const navigate = useNavigate()
	const themeColor = localStorage.getItem('color_rgb') || defaultTheme

	const usernameValue = Form.useWatch('username', form)

	const handleLogin = async (values: LoginInput) => {
		try {
			setLoading(true)
			const { remember, ...rest } = values
			const res = await login(rest)
			const token = res.data.token
			if (token) {
				sessionStorage.setItem('token', token)
				if (remember) localStorage.setItem('token', token)
			} else throw new Error('未从登录响应中获取凭证信息')
			navigate('/')
			msgApi.success('欢迎回来')
		} catch (err: any) {
			// 验证码
			if (err.data?.captchaBase64) setCaptchaBase64(err.data.captchaBase64)
		} finally {
			setLoading(false)
		}
	}

	const refreshCaptcha = async () => {
		try {
			setLoading(true)
			const username = form.getFieldValue('username')
			const res = await refreshCaptchaBase64(username)
			if (res.data?.captchaBase64) setCaptchaBase64(res.data.captchaBase64)
		} catch {
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		setCaptchaBase64('') // username变化时隐藏验证码
	}, [usernameValue])

	return (
		<>
			{msgContextHolder}
			<div className={styles.loginContainer}>
				<Card className={styles.loginCard}>
					<div className={styles.header}>
						<Title level={2} style={{ color: themeColor, fontWeight: 800 }}>
							MIZUKI MANAGER
						</Title>
						<Text type="secondary">Mizuki 博客管理器</Text>
					</div>
					<Form form={form} onFinish={handleLogin} size="large" initialValues={{ remember: false }}>
						<Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
							<Input prefix={<UserOutlined style={{ color: themeColor }} />} placeholder="用户名" autoComplete="off" />
						</Form.Item>
						<Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
							<Input.Password prefix={<LockOutlined style={{ color: themeColor }} />} placeholder="密码" autoComplete="off" />
						</Form.Item>
						{captchaBase64 && (
							<Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
								<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
									<Input placeholder="请输入验证码" autoComplete="off" />
									<img
										onClick={refreshCaptcha}
										loading="lazy"
										src={captchaBase64}
										style={{
											width: 120,
											height: 40,
											borderRadius: 4,
											cursor: 'pointer',
											objectFit: 'contain'
										}}
										alt="验证码"
									/>
								</div>
							</Form.Item>
						)}
						<Form.Item>
							<div className={styles.options}>
								<Form.Item name="remember" valuePropName="checked" noStyle>
									<Checkbox>记住我</Checkbox>
								</Form.Item>
								<a style={{ color: themeColor }} onClick={() => msgApi.warning('默认账号密码在 .env 环境变量配置文件中更改')}>
									忘记密码？
								</a>
							</div>
						</Form.Item>
						<Form.Item>
							<Button htmlType="submit" type="primary" block loading={loading} className={styles.submitBtn} style={{ backgroundColor: themeColor, borderColor: themeColor, margin: 0 }}>
								登 录
							</Button>
						</Form.Item>
					</Form>
				</Card>
			</div>
		</>
	)
}
