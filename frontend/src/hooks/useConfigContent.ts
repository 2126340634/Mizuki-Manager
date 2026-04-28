import { useRef } from 'react'
import { openDB, DBInstance } from '../utils/database'

export const useConfigContentDB = () => {
	const dbRef = useRef<DBInstance>(null)

	const _getDB = async () => {
		if (dbRef.current) return dbRef.current
		const inst = await openDB('config_content_store')
		dbRef.current = inst
		return inst
	}

	const saveCache = async (content: string) => {
		const db = await _getDB()
		return await db.put({ id: 'latest', content })
	}

	const getCache = async () => {
		const db = await _getDB()
		const data = await db.getById('latest')
		return data?.content || ''
	}

	const clearCache = async () => {
		const db = await _getDB()
		return await db.put({ id: 'latest', content: '' })
	}

	return { saveCache, getCache, clearCache }
}
