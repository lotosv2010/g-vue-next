import { hasChanged, isArray, isFunction, isObject } from "@g-vue-next/shared"
import { toReactive } from "./reactive"
import { createDep, Dep } from "./dep"
import { activeEffect, trackEffect, triggerEffects } from "./effect"

export interface Ref<T = any> {
  value: T
}

export type MaybeRef<T = any> = Ref<T> | T

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

class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly __v_isRef = true
  constructor(private readonly _object: T, private _key: K, private readonly _defaultValue?: T[K]) {}
  get value() {
    const val = this._object[this._key]
    return val === undefined ? this._defaultValue : val
  }
  set value(newValue) {
    this._object[this._key] = newValue
  }
}

function propertyToRef(source: Record<string, any>, key: string, defaultValue?: unknown): any {
  const val = source[key]
  return isRef(val) ? val : new ObjectRefImpl(source, key, defaultValue)
}

class GetterRefImpl<T> {
  public readonly __v_isRef = true
  public readonly __v_isReadonly = true
  constructor(private readonly _getter: () => T) {}
  get value() {
    return this._getter()
  }

}
export const toRef = (source: Record<string, any> | any , key?: string, defaultValue?: unknown) => {
  if (isRef(source)) {
    return source
  } else if (isFunction(source)) {
    return new GetterRefImpl(source)
  } else if (isObject(source)) {
    return propertyToRef(source, key, defaultValue)
  } else {
    return ref(source)
  }
}

export const toRefs = (object: Record<string, any>) => {
  const ret: any = isArray(object) ? new Array(object.length) : {}
  for (const key in object) {
    ret[key] = propertyToRef(object, key)
  }
  return ret
}

export const unref = <T>(ref: MaybeRef<T>): T => isRef(ref) ? ref.value : ref 

export const proxyRefs = <T extends object>(objectWithRefs: T) => {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      return unref(Reflect.get(target, key, receiver))
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      } else {
        return Reflect.set(target, key, value, receiver)
      }
    }
  })
}

export function toValue<T>(source: any): T {
  return isFunction(source) ? source(): unref(source)
}