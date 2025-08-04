import { EMPTY_OBJ, isFunction } from "@g-vue-next/shared";
import { VNodeChild, type VNode } from "./vnode";
import { reactive } from "@g-vue-next/reactivity";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initProps } from "./componentProps";

export type Data = Record<string, unknown>;

export type InternalRenderFunction = {
  (
    ctx:  any,
    cache: ComponentInternalInstance['renderCache'],
    $props: ComponentInternalInstance['props'],
    $setup: ComponentInternalInstance['setupState'],
    $data: ComponentInternalInstance['data'],
    $options: ComponentInternalInstance['ctx'],
  ): VNodeChild
}

export interface ComponentInternalInstance {
  vnode: VNode
  parent: ComponentInternalInstance | null
  root: ComponentInternalInstance
  subTree: VNode
  suspense: any | null
  type: any
  next?: VNode | null
  update: () => void
  render: InternalRenderFunction | null
  renderCache: (Function | VNode | undefined)[]
  ctx: Data
  proxy: any | null
  propsOptions: Data
  // state
  data: Data
  props: Data
  attrs: Data
  setupState: Data
  // lifecycle hooks
  isMounted: boolean
}

export type Component = 
  | ComponentInternalInstance

export function createComponentInstance (
  vnode: VNode,
  parent: ComponentInternalInstance | null,
  suspense: any |null
): ComponentInternalInstance {
  const instance = {
    vnode, // 组件的虚拟DOM
    parent, // 父组件实例
    root: null, // 根组件实例
    subTree: null, // 组件的子虚拟DOM
    suspense, // 组件的 Suspense 实例
    type: vnode.type, // 组件的类型
    update: null, // 组件的更新函数：创建一个函数，用于更新组件 ==> effect.run()
    render: null, // 组件的 render 函数
    renderCache: [], // 缓存组件的 render 函数的返回值
    ctx: EMPTY_OBJ, // 组件的上下文
    proxy: null, // 组件的代理对象
    propsOptions: (vnode.type as any)?.props || {}, // 用户声明的 props 
    data: EMPTY_OBJ, // 组件的 data 数据
    props: EMPTY_OBJ, // 组件的 props 数据
    attrs: EMPTY_OBJ, // 组件的 attrs 数据
    setupState: EMPTY_OBJ,
    isMounted: false, // 组件是否已挂载
  }
  instance.ctx = {_: instance } // 创建组件实例的 ctx 属性
  instance.root = parent ? parent.root : instance // 创建组件实例的 root 属性
  return instance
}

export function setupComponent(instance: ComponentInternalInstance) { 
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: ComponentInternalInstance) {
  const { props, children } = instance.vnode
  // 初始化组件实例的props
  initProps(instance, props)

  const Component = instance.type
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
  // 创建组件实例的 data 数据
  const data: Function = Component.data
  if (data) {
    if (isFunction(data)) {
      instance.data = reactive(data.call(instance.proxy))
    } else {
      console.warn('data must be a function')
    }
  }

  if (!instance.render) {
    // 将组件实例的render函数赋值给组件实例
    instance.render = Component.render
  }
}