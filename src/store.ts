import { create } from 'zustand'

// WebGL available? Without it there is no 3D portrait; the rest of the page still works.
export const HAS_WEBGL = (() => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch {
    return false
  }
})()

interface StoreState {
  ready: boolean // me.glb parsed and mounted in the scene
  setReady: () => void
  modelError: boolean // me.glb failed to load, or WebGL is unavailable
  setModelError: () => void
}

export const useStore = create<StoreState>((set) => ({
  ready: false,
  setReady: () => set({ ready: true }),
  modelError: !HAS_WEBGL,
  setModelError: () => set({ modelError: true }),
}))
