import React from 'react'
import {
	HomeOutlined,
	SettingOutlined,
	BuildOutlined,
	PictureOutlined,
	PlayCircleOutlined,
	FileTextOutlined,
	ProjectOutlined,
	TeamOutlined,
	BookOutlined,
	DeploymentUnitOutlined,
	HistoryOutlined,
	InfoCircleOutlined,
	CustomerServiceOutlined
} from '@ant-design/icons'

export const managerList = [
	{ title: '首页', subtitle: 'Home', icon: <HomeOutlined />, path: '/index', hidden: true },
	{ title: '关于', subtitle: 'About', icon: <InfoCircleOutlined />, path: '/about' },
	{ title: '相册 ', subtitle: 'Album', icon: <PictureOutlined /> },
	{ title: '追番', subtitle: 'Anime', icon: <PlayCircleOutlined /> },
	{ title: '构建部署', subtitle: 'Build', icon: <BuildOutlined /> },
	{ title: '配置', subtitle: 'Config', icon: <SettingOutlined /> },
	{ title: '我的设备', subtitle: 'Device', icon: <DeploymentUnitOutlined /> },
	{ title: '日记', subtitle: 'Diary', icon: <BookOutlined /> },
	{ title: '友链', subtitle: 'Friend', icon: <TeamOutlined /> },
	{ title: '文章', subtitle: 'Post', icon: <FileTextOutlined /> },
	{ title: '项目展示', subtitle: 'Project', icon: <ProjectOutlined /> },
	{ title: '技能展示', subtitle: 'Skill', icon: <CustomerServiceOutlined /> },
	{ title: '时间线', subtitle: 'Timeline', icon: <HistoryOutlined /> }
]
