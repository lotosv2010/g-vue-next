import { ComponentInternalInstance, currentInstance, setCurrentInstance } from "./component"
import { LifecycleHooks } from "./enums"

export const injectHooks = (
  type: LifecycleHooks,
  hook: Function,
  target: ComponentInternalInstance | null = currentInstance,
  prepend = false
) => { 
  if (target) {
    // 获取当前组件实例中的生命周期函数
    const hooks = target[type] || (target[type] = [])
    // 利用闭包，将hook函数进行包装，包装后的函数会打印出当前组件实例
    const wrapperHook: any = () => {
      // 钩子执行前，对实例进行校正处理
      const reset = setCurrentInstance(target)
      // 钩子执行
      hook.call(target)
      // 钩子执行后，恢复实例
      reset()
    }
    if(prepend) {
      hooks.unshift(wrapperHook)
    } else {
      hooks.push(wrapperHook)
    }
  }
}

export const createHook = <T extends Function = () => any>(lifecycle: LifecycleHooks) => {
  return (
    hook: T, 
    target: ComponentInternalInstance | null = currentInstance // 将当前实例关联到此钩子上
  ) => injectHooks(lifecycle, (...args: unknown[]) => hook(...args), target)
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)
export const onActivated = createHook(LifecycleHooks.ACTIVATED)
export const onDeactivated = createHook(LifecycleHooks.DEACTIVATED)
export const onRenderTracked = createHook(LifecycleHooks.RENDER_TRACKED)
export const onRenderTriggered = createHook(LifecycleHooks.RENDER_TRIGGERED)
export const onErrorCaptured = createHook(LifecycleHooks.ERROR_CAPTURED)
export const onServerPrefetch = createHook(LifecycleHooks.SERVER_PREFETCH)