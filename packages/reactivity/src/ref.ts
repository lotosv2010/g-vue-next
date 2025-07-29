import { hasChanged } from "@g-vue-next/shared"
import { toReactive } from "./reactive"
import { createDep, Dep } from "./dep"
import { activeEffect, trackEffect, triggerEffects } from "./effect"

export interface Ref<T = any> {
  value: T
}

export const ref = (value: unknown) => {
  return createRef(value, false)
}

export function isRef<T>(r: Ref<T> | unknown):r is Ref<T>
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}

function createRef(rawValue: unknown, shallow?: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T // 缓存值
  private _rawValue: T // 原始值
  public readonly __v_isRef = true // 标记是 ref 对象
  public dep?: Dep = undefined // 记录依赖项
  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._value = __v_isShallow ? value : toReactive(value)
    this._rawValue = value
  }
  get value() {
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._value = newValue
      this._rawValue = newValue
      triggerRefValue(this)
    }
  }
}

export const trackRefValue = (ref: any) => {
  if(activeEffect) {
    trackEffect(activeEffect, ref.dep ??= createDep(() => (ref.dep = undefined), undefined))
  }
}
export const triggerRefValue = (ref: any) => {
  const dep = ref.dep
  if (dep) {
    triggerEffects(dep)
  }
}