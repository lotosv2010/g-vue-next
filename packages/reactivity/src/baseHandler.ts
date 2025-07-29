import { hasChanged, isObject } from "@g-vue-next/shared"
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from "./constants"
import { reactive } from "./reactive"
import { track, trigger } from "./reactiveEffect"

class BaseReactiveHandler implements ProxyHandler<any> {
  get(target, p, receiver) {
    //! receiver 表示代理对象本身
    // 判断是否是 IS_REACTIVE, 如果是表示是一个代理对象则返回 true
    if (p === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    // 收集依赖
    track(target, TrackOpTypes.GET, p)
    // 获取属性值
    const res = Reflect.get(target, p, receiver)
    // 深度代理，递归代理
    if(isObject(res)) {
      return reactive(res)
    }
    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  set(target, p, value, receiver) {
    let oldValue = target[p] // 获取旧值
    const res = Reflect.set(target, p, value, receiver)
    if (hasChanged(value, oldValue)) {
      // 触发依赖
      trigger(target, TriggerOpTypes.SET, p, value, oldValue)
    }
    return res
  }
}

// 响应式对象的处理器
export const mutableHandlers: ProxyHandler<object> = new MutableReactiveHandler()