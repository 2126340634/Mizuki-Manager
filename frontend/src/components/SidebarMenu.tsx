import React, { useEffect } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { managerList } from '../configs/managerConfig'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState, updateSelect } from '../stores'
interface Props {
	menuClick: (selectedItem: MenuItem) => void
}

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = managerList.map((item) => ({
	key: item.path as string,
	label: `${item.title} (${item.subtitle})`,
	icon: item.icon,
	path: item.path
}))

export default function SidebarMenu({ menuClick }: Props) {
	const nav = useNavigate()
	const location = useLocation()
	const dispatch = useDispatch<AppDispatch>()
	const { selectedKey } = useSelector((state: RootState) => state.menu)
	// 监听路由变化选中菜单
	useEffect(() => {
		const matchedItem = menuItems.find((item) => item?.key === location.pathname || location.pathname.startsWith(`${item?.key}/`))
		if (matchedItem) {
			if (selectedKey !== matchedItem.key) {
				dispatch(updateSelect(matchedItem.key))
			}
		}
	}, [location.pathname])
	return (
		<Menu
			onSelect={(e: any) => {
				const path = e.key
				nav(path)
				dispatch(updateSelect(path))
				const matchedItem = menuItems.find((item) => item?.key === path)
				if (matchedItem) {
					menuClick(matchedItem)
				}
			}}
			selectedKeys={[selectedKey]}
			items={menuItems}
			mode="inline"
			style={{ width: 280, marginTop: 38 }}
		/>
	)
}
