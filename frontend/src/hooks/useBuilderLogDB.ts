import { useEffect, useRef } from 'react'
import { builderLogDB, BuilderLogDBInstance } from '../utils/db/builder-log'

// 构建日志固定用一个
const LOG_DB_ID = 'latest_deploy_log'
export const useBuilderLogDB = () => {
	const dbRef = useRef<BuilderLogDBInstance>(null)

	useEffect(() => {}, [])

	const _getDB = async () => {
		if (dbRef.current) return dbRef.current
		const inst = await builderLogDB()
		dbRef.current = inst
		return inst
	}

	const saveCache = async (log: string) => {
		const db = await _getDB()
		return await db.putLog({ id: LOG_DB_ID, log })
	}

	const getCache = async () => {
		const db = await _getDB()
		const data = await db.getLogById(LOG_DB_ID)
		return data?.log || ''
	}

	const clearCache = async () => {
		const db = await _getDB()
		return await db.putLog({ id: LOG_DB_ID, log: '' })
	}

	return { saveCache, getCache, clearCache }
}
