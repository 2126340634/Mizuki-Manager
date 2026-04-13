import React from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { managerList } from '../configs/managerConfig'

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = managerList.map((item, index) => ({
	key: `manager-${index}`,
	label: `${item.title} (${item.subtitle})`,
	icon: item.icon
}))

export default function SidebarMenu() {
	return <Menu items={menuItems} mode="inline" style={{ width: 200, marginRight: 12, background: 'transparent', minHeight: '100vh' }} />
}
