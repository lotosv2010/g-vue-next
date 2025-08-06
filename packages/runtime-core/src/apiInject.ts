import { isFunction } from "@g-vue-next/shared";
import { currentInstance } from "./component";

export interface InjectionKey<T> extends Symbol{}

export function provide<T, K = InjectionKey<T> | string | number>(
  key: K,
  value: K extends InjectionKey<infer V> ? V : T
) {
  if (!currentInstance) {
    console.warn(`provide() can only be used inside setup() .`)
  } else {
    // 获取当前组件实例的 provides
    let provides = currentInstance.provides
    // 获取父级组件实例的 provides
    const parentProvides = currentInstance?.parent?.provides
    // 如果当前组件实例的 provides 和 父级组件实例的 provides 相同，则创建一个新的 provides
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    // 将 key 和 value 添加到 provides 中
    provides[key as string] = value
  }
}
export function inject<T>(key: InjectionKey<T> | string): T | undefined
export function inject<T>(
  key: InjectionKey<T> | string,
  defaultValue: T | (() => T),
  treatDefaultAsFactory?: false
)
export function inject<T>(
  key: InjectionKey<T> | string,
  defaultValue: T | (() => T),
  treatDefaultAsFactory?: true
)
export function inject(
  key: InjectionKey<any> | string,
  defaultValue?: any,
  treatDefaultAsFactory = false
) {
  const instance = currentInstance
  if (instance) {
    const provides = instance
    ? instance.parent
      ? instance.parent.provides 
      : instance.provides 
    : null
    if (provides &&(key as string in provides)) {
      return provides[key as string]
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue)
        ? defaultValue.call(instance && instance.proxy)
        : defaultValue
    } else {
      console.warn(`injection "${String(key)}" not found.`)
    }
  } else {
    console.warn(`inject() can only be used inside setup() or functional components.`)
  }
}