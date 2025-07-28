import { extend } from "@g-vue-next/shared"
import { Dep } from "./dep"

// 执行 effect 之前的清理逻辑
const preCleanupEffect = (effect: ReactiveEffect) => {
  effect._trackId ++ // trackId 递增，用于判断是否需要执行 cleanup
  effect._depsLength = 0 // 重置 deps 的长度
}

// 执行 effect 之后的清理逻辑
// 首次：{flag, name, age}
// 更新：{flag}
// 此时需要删除多余的属性 name 和 age
const postCleanupEffect = (effect: ReactiveEffect) => {
  // 如果 依赖项的 deps 的长度小于 trackId，则说明有属性被删除
  if (effect.deps.length > effect._depsLength) {
    //遍历删除的属性
    for (let i = effect._depsLength; i < effect.deps.length; i ++) {
      cleanupDepEffect(effect.deps[i], effect)
    }
    // 重置 deps 的长度
    effect.deps.length = effect._depsLength
  }
}

export let activeEffect: any // 当前激活的effect

// 创建响应式 effect
export class ReactiveEffect {
  public active = true // 是否激活
  deps: any[] = [] // 存储依赖关系
  _trackId = 0 // 用于记录 effect 执行的次数, 防止重复收集依赖
  _depsLength = 0 // 用于记录 deps 的长度
  _running = 0 // 用于记录 effect 是否正在执行

  constructor(public fn: Function, public scheduler?: Function) {}
  run() {
    // 如果没有激活，则直接执行fn
    if (!this.active) {
      return this.fn()
    }
    let lastEffect = activeEffect // 保存当前激活的effect
    try {
      activeEffect = this // 设置当前激活的effect
      // 标记为正在执行
      this._running++
      // 执行之前需要清理旧的依赖关系
      preCleanupEffect(this)
      return this.fn() // 执行fn
    } finally {
      // 标记为执行完毕
      this._running--
      // 执行后需要清理旧的依赖关系
      postCleanupEffect(this)
      activeEffect = lastEffect // 恢复上一次激活的effect
    }
  }
}

// 创建effect
export const effect = (fn: Function, options: Record<string, any> = {}) => {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  // 判断是否有用户传递的配置
  if (options) {
    // 合并配置
    extend(_effect, options)
  }
  // 执行渲染
  _effect.run()

  // 定义 runner 方法，返回给用户，让用户决定何时执行 effect
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

// 清理旧的依赖关系
function cleanupDepEffect(dep: Dep, effect: ReactiveEffect) {
  // 获取对象和属性的依赖关系
  const trackId = dep.get(effect)
  // 如果对象和属性的依赖关系存在, 且对象和属性的依赖关系和当前effect的依赖关系不一致, 则清理
  if (trackId !== undefined && effect._trackId !== trackId) {
    // 清理对象和属性的依赖关系
    dep.delete(effect)
    // 如果对象和属性的依赖关系不存在, 则清理
    if (dep.size === 0) {
      // 清理对象和属性的依赖关系
      dep.cleanup()
    }
  }
}

// 双向记录：将effect添加到dep中映射表中，后续可以根据值的变化触发此映射表中的 effect 
// 首次：{ flag, name }
// 更新：{ flag, age }, 此时需要将 旧的 { flag, name } 中的 name 删除
// 最终：将 age 添加到 { flag, age } 中
export const trackEffect = (effect: ReactiveEffect, dep: Dep) => {
  // 如果上一次依赖项的追踪ID与当前追踪ID不同，则添加依赖项
  if (dep.get(effect) !== effect._trackId) {
    // 添加依赖项 
    dep.set(effect, effect._trackId)
    // 获取上一次的依赖项
    const oldDep = effect.deps[effect._depsLength]
    // 如果上一次的依赖项不等于新的依赖项
    if (oldDep !== dep) {
      // 如果上一次的依赖项存在
      if (oldDep) {
        // 删除旧的依赖项
        cleanupDepEffect(oldDep, effect)
      }
      // 添加新的依赖项
      effect.deps[effect._depsLength++] = dep
    } else {
      effect._depsLength++ // 添加依赖项长度
    }
  }
}

// 触发：将dep中的effect添加到effectScheduler中执行
export const triggerEffects = (dep: Dep) => {
  for (const effect of dep.keys()) {
    if (!effect._running) {
      if (effect.scheduler) {
        // 执行调度器，等价于调用 effect.run()
        effect.scheduler() 
      } else {
        // 否则执行 effect.run()
        effect.run()
      }
    }
  }
}