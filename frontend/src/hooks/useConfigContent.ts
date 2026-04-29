import { useRef } from 'react'
import { openDB, DBInstance } from '../utils/database'

// latest为最新修改的表单数据缓存, original_data为请求获取的原始数据缓存
type ConfigId = 'latest' | 'original_data'

export const useConfigContentDB = () => {
	const dbRef = useRef<DBInstance>(null)

	const _getDB = async () => {
		if (dbRef.current) return dbRef.current
		const inst = await openDB('config_content_store')
		dbRef.current = inst
		return inst
	}

	const saveCache = async (id: ConfigId, content: string) => {
		const db = await _getDB()
		return await db.put({ id, content })
	}

	const getCache = async (id: ConfigId) => {
		const db = await _getDB()
		const data = await db.getById(id)
		return data?.content || ''
	}

	const clearCache = async (id: ConfigId) => {
		const db = await _getDB()
		return await db.put({ id, content: '' })
	}

	return { saveCache, getCache, clearCache }
}
