import { ComputedRef, isReactive, isRef, ReactiveEffect, Ref } from "@g-vue-next/reactivity";
import { isFunction, isObject } from "@g-vue-next/shared";

export interface WatchOptionsBase {
  flush?: 'pre' | 'post' | 'sync' // 默认：'pre'
}

export interface WatchOptions extends WatchOptionsBase {
  deep?: boolean | number;
  immediate?: boolean;
}

export type OnCleanup = (cleanupFn: () => void) => void;

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T);

export type WatchEffect = (onCleanup: OnCleanup) => void;

export type WatchCallback<V = any, OV = any> = (newValue: V, oldValue: OV, onCleanup: OnCleanup) => void;

export type WatchStopHandle = () => void;

function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: Function,
  {
    deep,
    immediate,
    flush
  }: WatchOptions = {}
): WatchStopHandle {
  const reactiveGetter = (source: object) => {
    if(deep) return source
    if (deep === false || deep === 0) {
      return traverse(source, 1)
    }
    return traverse(source)
  }

  let getter
  let oldValue
  if (isReactive(source)) {
    getter = () => reactiveGetter(source)
  } else if (isRef(source)) {
    getter = () => source.value
  } else if (isFunction(source)) {
    if (cb) {
      getter = source
    } else {
      getter = () => { // watchEffect
        if (cleanup) cleanup()
        return (source as any)(onCleanup)
      }
    }
  }

  if (cb && deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  let cleanup: (() => void) | undefined
  let onCleanup: OnCleanup = (fn: () => void) => {
    cleanup = () => {
      fn() // 执行用户传入的函数, 执行清除副作用的逻辑
      cleanup = undefined // 重置清除函数
    }
  }

  const job = () => {
    if (cb) { // watch(source, cb)
      const newValue = effect.run()
      // 执行回调前，先调用上一次的清理操作进行清理
      if (cleanup) {
        cleanup()
      }
      cb(newValue, oldValue, onCleanup)
      oldValue = newValue
    } else { // watchEffect
      effect.run()
    }
  }

  const effect = new ReactiveEffect(getter, job)

  if (cb) { // watch
    if (immediate) { // 立即执行一遍, 传递新值和老值
      job()
    } else {
      oldValue = effect.run()
    }
  } else { // watchEffect
    effect.run()
  }

  const unwatch = () => {
    effect.stop()
  }
  return unwatch
}

export function traverse(value: unknown, depth: number = Infinity, seen?: Set<unknown>) {
  if (depth <= 0 || !isObject(value)) {
    return value;
  }

  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  depth--
  for (const key in value as any) {
    traverse(value[key], depth, seen);
  }
  return value
}

export const watch = <T = any>(source: WatchSource<T> | T, cb: any, options?: WatchOptions): WatchStopHandle => {
  return doWatch(source as any, cb, options);
};

export const watchEffect = (effect: WatchEffect, options?: WatchOptionsBase): WatchStopHandle => {
  return doWatch(effect, null, options)
}