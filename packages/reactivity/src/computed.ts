import { isFunction, NOOP } from "@g-vue-next/shared";
import { ReactiveEffect } from "./effect";
import { Dep } from "./dep";
import { trackRefValue, triggerRefValue } from "./ref";

declare const ComputedRefSymbol: unique symbol

export type ComputedGetter<T> = (oldValue?: T) => T
export type ComputedSetter<T> = (value: T) => void
export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export interface WritableComputedRef<T> {
  readonly effect: ReactiveEffect<T>
}

export interface ComputedRef<T> extends WritableComputedRef<T> {
  value: T
  [ComputedRefSymbol]: true
}

class ComputedRefImpl<T> { 
  public readonly effect: ReactiveEffect<T> // 记录响应式依赖关系
  public dep?: Dep = undefined // 记录依赖关系
  public __v_isRef = true // 标记这是一个 ref 对象
  private _value: T // 缓存值

  constructor(
    private getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
    isReadonly: boolean
  ) {
    this.effect = new ReactiveEffect(
      () => getter(this._value), // 创建响应式依赖关系
      () => { // 触发依赖关系
        // 计算属性依赖的值变化后，触发渲染 effect 
        // 还需要让计算属性的 effect 的 dirty 变脏
        triggerRefValue(this)
      }
    )
  }

  get value() { 
    // 这里的作用是做优化，只有当 effect.dirty=true 的时候才会触发重新计算
    if (this.effect.dirty) {
      this._value = this.effect.run()
      // 这里的作用是让计算属性和其依赖收的 effect 关联起来，并且让 effect 的 dirty 设置为 true，这样就能触发渲染 effect 
      trackRefValue(this) // 收集依赖
    }
    return this._value;
  }
  set value(newValue: T) {
    // 这个就是 ref 的 setter
    this._setter(newValue)
  }
  get _dirty() {
    return this.effect.dirty
  }
  set _dirty(v: boolean) {
    this.effect.dirty = v
  }
}

export function computed<T>(getter: ComputedGetter<T>, debugOptions?: object): ComputedRef<T>
export function computed<T>(options: WritableComputedOptions<T>, debugOptions?: object): WritableComputedRef<T>
export function computed<T>(getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>, debugOptions?: object): ComputedRef<T> | WritableComputedRef<T> {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions as ComputedGetter<T>
    setter = NOOP
  } else {
    getter = (getterOrOptions as WritableComputedOptions<T>).get
    setter = (getterOrOptions as WritableComputedOptions<T>).set
  }

  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter)
  return cRef
}