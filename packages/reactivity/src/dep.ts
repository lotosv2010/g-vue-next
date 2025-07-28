import { ReactiveEffect } from "./effect"

export type Dep = Map<ReactiveEffect, number> & {
  cleanup: () => void
  computed?: any
  name?: string // 源码中没有这个属性，这里为了方便调试
}

// 创建依赖关系
export const createDep = (cleanup: () => void, computed?: any, key?: unknown): Dep => {
  const dep = new Map() as any
  dep.cleanup = cleanup
  dep.name = key
  return dep
}