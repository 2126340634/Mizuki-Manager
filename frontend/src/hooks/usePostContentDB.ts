import { useRef } from 'react'
import { openDB, DBInstance } from '../utils/database'

export const usePostContentDB = () => {
	const dbRef = useRef<DBInstance>(null)

	const _getDB = async () => {
		if (dbRef.current) return dbRef.current
		const inst = await openDB('post_content_store')
		dbRef.current = inst
		return inst
	}

	// 缓存文章需要手动指定ID
	const saveCache = async (id: string | number, content: string) => {
		const db = await _getDB()
		return await db.put({ id, content })
	}

	const getCache = async (id: string | number) => {
		const db = await _getDB()
		const data = await db.getById(id)
		return data?.content || ''
	}

	const clearCache = async (id: string | number) => {
		const db = await _getDB()
		return await db.put({ id, content: '' })
	}

	return { saveCache, getCache, clearCache }
}
