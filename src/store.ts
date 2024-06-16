import create from 'zustand'

interface StoreState {
  tempo: number
  key?: string
  loudness: number
  energy: number
}

const useStore = create<StoreState>((set) => ({
  tempo: 0,
  key: undefined,
  loudness: 0,
  energy: 0,
}))

export default useStore