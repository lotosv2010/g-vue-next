import { extend, hasOwn } from "@g-vue-next/shared"
import { ComponentInternalInstance } from "./component"

export interface ComponentRenderContext {
  [key: string]: any
  _: ComponentInternalInstance
}

// 获取组件实例的代理对象
const  getPublicInstance = (i: ComponentInternalInstance | null) => {
  if (!i) return null
  if (i.parent && i.parent.proxy) {
    return i.parent.proxy
  }
  return getPublicInstance(i.parent)
}

// publicPropertiesMap 映射组件实例的属性
export const publicPropertiesMap = extend(Object.create(null), {
  $i: i => i,
  $el: i => i.vnode.el,
  $data: i => i.data,
  $props: i => i.props,
  $attrs: i => i.attrs,
  $slots: i => i.slots,
  $refs: i => i.refs,
  $parent: i => getPublicInstance(i.parent),
  $root: i => getPublicInstance(i.root),
  $emit: i => i.emit,
  $options: i => i.type
})

// 创建组件实例的代理对象
export const PublicInstanceProxyHandlers = {
  get({ _: instance}: ComponentRenderContext, key, receiver) {
    const { data, props } = instance
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    }
    // 获取以 $ 开头的属性
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
  set({ _: instance }: ComponentRenderContext, key, value, receiver) {
    const { data, props } = instance
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (props && hasOwn(props, key)) {
      console.warn(`Attempting to mutate prop "${key}". Props are readonly.`)
      return false
    }
    return true
  }
}