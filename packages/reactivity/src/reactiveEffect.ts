import { TrackOpTypes, TriggerOpTypes } from "./constants";
import { createDep } from "./dep";
import { activeEffect, trackEffect, triggerEffects } from "./effect";

// 存储对象和属性的依赖关系
const targetMap = new WeakMap();
// 收集依赖
export const track = (target: object, type: TrackOpTypes, key: unknown) => {
  // 判断当前是否处于effect中
  if (activeEffect) {
    // 获取对象和属性的依赖关系
    let depsMap = targetMap.get(target);
    // 如果对象和属性的依赖关系不存在, 则创建
    if (!depsMap) {
      // 创建对象和属性的依赖关系
      targetMap.set(target, (depsMap = new Map()))
    }
    // 获取属性的依赖关系
    let dep = depsMap.get(key);
    // 如果属性的依赖关系不存在, 则创建
    if(!dep) {
      // 创建属性的依赖关系
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), null, key)))
    }
    // 添加依赖关系
    trackEffect(activeEffect, dep)
  }
}

// 触发更新
export const trigger = (target, type: TriggerOpTypes, key?: unknown, value?: unknown, oldValue?: unknown) => {
  // 获取对象和属性的依赖关系
  const depsMap = targetMap.get(target)
  // 如果对象和属性的依赖关系不存在, 则返回
  if (!depsMap) return
  // 获取属性的依赖关系
  let dep = depsMap.get(key)
  // 如果属性的依赖关系存在, 则触发更新
  if (dep) {
    // 触发更新
    triggerEffects(dep)
  }
}