import create from 'zustand'

interface StoreState {
  speed: number
  tempo: number
}

const useStore = create<StoreState>(() => ({
  speed: 0,
  tempo: 0,
}))

export default useStore