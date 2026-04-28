type StoreName = 'builder_log_store' | 'about_content_store' | 'config_content_store'
export interface DBContent {
	id: number | string
	content: string
	timestamp?: number
}

export interface DBInstance {
	put: (data: DBContent) => Promise<boolean>
	getById: (id: string | number) => Promise<DBContent>
	getAll: () => Promise<DBContent[]>
}

const ALL_STORES: StoreName[] = ['builder_log_store', 'about_content_store', 'config_content_store']
const DB_NAME = 'MizukiCache'
const DB_VERSION = Number(process.env.DB_VERSION || '1')

export const openDB = async (storeName: StoreName): Promise<DBInstance> => {
	// 连接数据库
	const _connectDB = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, DB_VERSION)
			req.onupgradeneeded = (ev) => {
				const db = (ev?.target as IDBOpenDBRequest)?.result
				ALL_STORES.forEach((name) => {
					if (!db.objectStoreNames.contains(name)) {
						db.createObjectStore(name, { keyPath: 'id', autoIncrement: true })
					}
				})
			}
			req.onsuccess = (ev) => {
				resolve((ev?.target as IDBOpenDBRequest)?.result)
			}
			req.onerror = (ev) => {
				reject((ev?.target as IDBOpenDBRequest)?.error)
			}
		})
	}

	const db = await _connectDB()

	const put = (data: DBContent): Promise<boolean> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readwrite')
			const store = transaction.objectStore(storeName)

			const req = store.put({ ...data, timestamp: Date.now() })
			req.onsuccess = () => resolve(true)
			req.onerror = () => reject(req.error)
		})
	}

	const getById = (id: string | number): Promise<DBContent> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readonly')
			const store = transaction.objectStore(storeName)

			const req = store.get(id)
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => reject(req.error)
		})
	}

	const getAll = (): Promise<DBContent[]> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeName, 'readonly')
			const store = transaction.objectStore(storeName)

			const req = store.getAll()
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => reject(req.error)
		})
	}

	return { put, getById, getAll }
}
