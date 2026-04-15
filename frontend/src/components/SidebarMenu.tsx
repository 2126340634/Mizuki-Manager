import React, { useEffect } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { managerList } from '../configs/managerConfig'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState, updateSelect } from '../stores'

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = managerList.map((item, index) => ({
	key: item.path as string,
	label: `${item.title} (${item.subtitle})`,
	icon: item.icon,
	path: item.path
}))

export default function SidebarMenu() {
	const nav = useNavigate()
	const dispatch = useDispatch<AppDispatch>()
	const { selectedKey } = useSelector((state: RootState) => state.menu)
	// 监听路由变化选中菜单
	useEffect(() => {
		const currentPath = location.pathname
		const matchedItem = menuItems.find((item) => item?.key === currentPath)
		if (matchedItem) {
			if (selectedKey !== matchedItem.key) {
				dispatch(updateSelect(matchedItem.key))
			}
		}
	}, [location.pathname])
	return (
		<Menu
			onSelect={(e: any) => {
				nav(e.item.props.path)
				dispatch(updateSelect(e.key))
			}}
			selectedKeys={[selectedKey]}
			items={menuItems}
			mode="inline"
			style={{ width: 200, paddingTop: 50, background: 'transparent', minHeight: '100vh' }}
		/>
	)
}
