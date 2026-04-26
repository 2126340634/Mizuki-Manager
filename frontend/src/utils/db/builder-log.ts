import { openDB, StoreName } from '../database'
interface BuilderLog {
	id: number | string
	log: string
}
export interface BuilderLogDBInstance {
	putLog: (data: BuilderLog) => Promise<boolean>
	getLogById: (id: string | number) => Promise<BuilderLog>
	getAllLogs: () => Promise<BuilderLog[]>
}
const STORE_NAME: StoreName = 'builder_log_store'
export const builderLogDB = async (): Promise<BuilderLogDBInstance> => {
	const db = await openDB(STORE_NAME)

	const putLog = (data: BuilderLog): Promise<boolean> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readwrite')
			const store = transaction.objectStore(STORE_NAME)

			const req = store.put({ ...data, timestamp: Date.now() })
			req.onsuccess = () => resolve(true)
			req.onerror = () => reject(req.error)
		})
	}
	const getLogById = (id: string | number): Promise<BuilderLog> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readonly')
			const store = transaction.objectStore(STORE_NAME)

			const req = store.get(id)
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => reject(req.error)
		})
	}
	const getAllLogs = (): Promise<BuilderLog[]> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readonly')
			const store = transaction.objectStore(STORE_NAME)

			const req = store.getAll()
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => reject(req.error)
		})
	}
	return { putLog, getLogById, getAllLogs }
}
