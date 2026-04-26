export type StoreName = 'builder_log_store'

const DB_NAME = 'MizukiCache'
const DB_VERSION = 1

export const openDB = (storeName: StoreName): Promise<IDBDatabase> => {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION)
		req.onupgradeneeded = (ev) => {
			const db = (ev?.target as IDBOpenDBRequest)?.result
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
			}
		}
		req.onsuccess = (ev) => {
			resolve((ev?.target as IDBOpenDBRequest)?.result)
		}
		req.onerror = (ev) => {
			reject((ev?.target as IDBOpenDBRequest)?.error)
		}
	})
}
