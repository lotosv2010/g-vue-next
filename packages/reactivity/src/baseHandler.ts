import { ReactiveFlags } from "./reactive"

// 响应式对象的处理器
export const mutableHandlers: ProxyHandler<any> = {
  get(target, p, receiver) {
    //! receiver 表示代理对象本身
    // 判断是否是 IS_REACTIVE, 如果是表示是一个代理对象则返回 true
    if (p === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    return Reflect.get(target, p, receiver)
  },
  set(target, p, newValue, receiver) {
    return Reflect.set(target, p, newValue, receiver)
  },
}