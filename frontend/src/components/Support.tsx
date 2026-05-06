import React from 'react'
import { GithubOutlined } from '@ant-design/icons'
import styles from '../styles/components/support.module.scss'

export default function Support() {
	return (
		<div className={styles.container}>
			<span className={styles.text} onClick={() => window.open('https://github.com/LyraVoid/Mizuki', '_blank')}>
				<GithubOutlined />
				&nbsp;Mizuki Blog
			</span>
			<span className={styles.text} onClick={() => window.open('https://github.com/2126340634/Mizuki-Manager', '_blank')}>
				<GithubOutlined />
				&nbsp;Mizuki Manager
			</span>
		</div>
	)
}
