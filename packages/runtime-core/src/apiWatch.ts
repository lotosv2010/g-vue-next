import { ComputedRef, ReactiveEffect, Ref } from "@g-vue-next/reactivity";
import { isObject } from "@g-vue-next/shared";

export interface WatchOptions {
  deep?: boolean | number;
  immediate?: boolean;
}

export type OnCleanup = (cleanupFn: () => void) => void;

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T);

export type WatchEffect = (onCleanup: OnCleanup) => void;

export type WatchCallback<V = any, OV = any> = (newValue: V, oldValue: OV, onCleanup: OnCleanup) => void;

function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: Function,
  {
    deep,
    immediate
  }: WatchOptions = {}
) {
  const reactiveGetter = (source: object) => {
    if(deep) return source
    if (deep === false || deep === 0) {
      return traverse(source, 1)
    }
    return traverse(source)
  }

  let getter = () => reactiveGetter(source)
  let oldValue

  const job = () => {
    const newValue = effect.run()
    cb(newValue, oldValue)
    oldValue = newValue
  }

  if (cb && deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  const effect = new ReactiveEffect(getter, job)

  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  }
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

export const watch = <T = any>(source: WatchSource<T> | T, cb: any, options?: WatchOptions) => {
  return doWatch(source as any, cb, options);
};