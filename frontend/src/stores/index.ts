import { configureStore, createSlice } from '@reduxjs/toolkit'

// 侧边栏菜单
const menuSlice = createSlice({
	name: 'menu',
	initialState: { selectedKey: '/index' },
	reducers: {
		updateSelect: (state, action) => {
			state.selectedKey = action.payload
		}
	}
})

export const { updateSelect } = menuSlice.actions

const store = configureStore({
	reducer: {
		menu: menuSlice.reducer
	}
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
