import create from 'zustand'

interface StoreState {
  loudness: number[]
  speed: number
  tempo: number
}

const useStore = create<StoreState>(() => ({
  loudness: [],
  speed: 0,
  tempo: 0,
}))

export default useStore