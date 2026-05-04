import { createContext, useContext } from 'react'

interface Context {
	onNotify: (data: any) => void
}

const AppContext = createContext<Context | null>(null)

export function useGlobalContext() {
	const ctx = useContext(AppContext)
	if (!ctx) throw new Error('请检查是否包裹 Provider')
	return ctx
}

export default AppContext
