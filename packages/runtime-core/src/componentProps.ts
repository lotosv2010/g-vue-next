import { reactive } from "@g-vue-next/reactivity";
import { ComponentInternalInstance, Data } from "./component";
import { createInternalObject } from "./internalObject";
import { hasPropsChanged } from "./componentRenderUtils";

// 初始化 props
export function initProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null, // 用户传入的 props
  isStateful?: number
) {
  // 获取props
  const props: Data = {}
  // 获取attrs
  const attrs: Data = createInternalObject()
  // 获取组件的 props 选项
  const propsOptions = instance.propsOptions

  // 如果存在 rawProps
  if (rawProps) {
    // 遍历 rawProps rawProps 的属性复制到 props 和 attrs 中
    for (const key in rawProps) {
      const value = rawProps[key]
      if (key in propsOptions) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  // 原则上 props 只有第一层是响应式的
  // 源码内部使用的是 shallowReactive
  instance.props = reactive(props)
  instance.attrs = attrs
}

export function updateProps(instance: ComponentInternalInstance, rawProps: Data, rawPrevProps: Data) {
  if (hasPropsChanged(rawPrevProps, rawProps)) {
    // 将 rawProps 中的属性赋值给 rawPrevProps
    for (const key in rawProps) {
      instance.props[key] = rawProps[key]
    }
    // 删除 rawPrevProps 中不存在于 rawProps 的属性
    for (const key in rawPrevProps) {
      if (!(key in rawProps)) {
        Reflect.deleteProperty(instance.props, key)
      }
    }
  }
}
