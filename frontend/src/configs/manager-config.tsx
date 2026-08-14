import React from 'react'
import {
	HomeOutlined,
	SettingOutlined,
	RocketOutlined,
	PictureOutlined,
	PlayCircleOutlined,
	FileTextOutlined,
	ProjectOutlined,
	TeamOutlined,
	BookOutlined,
	DeploymentUnitOutlined,
	HistoryOutlined,
	InfoCircleOutlined,
	CustomerServiceOutlined,
	SoundOutlined
} from '@ant-design/icons'

export const managerList = [
	{ title: '首页', subtitle: 'Home', icon: <HomeOutlined />, path: '/index', hidden: true },
	{ title: '关于', subtitle: 'About', icon: <InfoCircleOutlined />, path: '/about' },
	{ title: '相册 ', subtitle: 'Album', icon: <PictureOutlined />, path: '/album' },
	{ title: '追番', subtitle: 'Anime', icon: <PlayCircleOutlined />, path: '/anime' },
	{ title: '构建部署', subtitle: 'Build', icon: <RocketOutlined />, path: '/builder' },
	{ title: '配置', subtitle: 'Config', icon: <SettingOutlined />, path: '/config' },
	{ title: '我的设备', subtitle: 'Device', icon: <DeploymentUnitOutlined />, path: '/device' },
	{ title: '日记', subtitle: 'Diary', icon: <BookOutlined />, path: '/diary' },
	{ title: '友链', subtitle: 'Friend', icon: <TeamOutlined />, path: '/friend' },
	{ title: '音乐播放器', subtitle: 'Music', icon: <SoundOutlined />, path: '/music' },
	{ title: '文章', subtitle: 'Post', icon: <FileTextOutlined />, path: '/post' },
	{ title: '项目展示', subtitle: 'Project', icon: <ProjectOutlined />, path: '/project' },
	{ title: '技能展示', subtitle: 'Skill', icon: <CustomerServiceOutlined />, path: '/skill' },
	{ title: '时间线', subtitle: 'Timeline', icon: <HistoryOutlined />, path: '/timeline' }
]
