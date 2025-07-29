import { isObject } from "@g-vue-next/shared"
import { mutableHandlers } from "./baseHandler"

// 响应式标识
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive", // 判断对象是否是响应式对象
}

// 缓存对象, 避免重复创建代理对象
const reactiveMap = new WeakMap()
// 创建代理对象
const createReactiveObject = (target: any) => {
  // 判断是否是一个对象, 如果不是对象, 直接返回
  if (!isObject(target)) {
    return target
  }
  // 创建代理对象
  const proxy = new Proxy(target, mutableHandlers)
  // 判断是否已经创建过代理对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  // 获取缓存的代理对象
  const existProxy = reactiveMap.get(target)
  // 判断对象是否已经被代理过, 如果被代理过, 则直接返回缓存的代理对象
  if (existProxy) {
    return existProxy
  }
  // 缓存对象
  reactiveMap.set(target, proxy)
  return proxy
}

/**
 * 创建响应式对象
 * @param target 目标对象
 * @returns 响应式对象
 */
export const reactive = (target: any) => {
  return createReactiveObject(target)
}

export const toReactive = <T extends unknown>(value: T): T => {
  return isObject(value) ? reactive(value) : value
}