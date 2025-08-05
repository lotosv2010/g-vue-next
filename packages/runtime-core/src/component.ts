import { camelize, EMPTY_OBJ, isFunction, isObject } from "@g-vue-next/shared";
import { VNodeChild, type VNode } from "./vnode";
import { proxyRefs, reactive } from "@g-vue-next/reactivity";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";

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

type EmitFn = {
  (event: string, ...args: any[]): void
}

export type Slot<T extends any = any> = (
  ...args: T[]
) => VNode[]

export type InternalSlots = {
  [name: string]: Slot | undefined
}

export type SetupContext = {
  attrs: Data;
  slots: Data;
  emit: EmitFn;
  expose: (exposed?: Data) => void  
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
  // expose
  exposed: Record<string, any> | null
  exposeProxy: Record<string, any> | null
  // state
  data: Data
  props: Data
  attrs: Data
  setupState: Data
  emit: EmitFn
  slots: InternalSlots
  // lifecycle hooks
  isMounted: boolean
}

export type Component = 
  | ComponentInternalInstance
// 创建组件实例
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
    exposed: null, // 组件的暴露对象
    exposeProxy: null, // 组件的 exposed 代理对象
    proxy: null, // 组件的代理对象
    propsOptions: (vnode.type as any)?.props || {}, // 用户声明的 props 
    data: EMPTY_OBJ, // 组件的 data 数据
    props: EMPTY_OBJ, // 组件的 props 数据
    attrs: EMPTY_OBJ, // 组件的 attrs 数据
    emit: null,
    slots: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    isMounted: false, // 组件是否已挂载
  }
  instance.ctx = {_: instance } // 创建组件实例的 ctx 属性
  instance.root = parent ? parent.root : instance // 创建组件实例的 root 属性
  return instance
}
// 设置组件的初始状态和行为
export function setupComponent(instance: ComponentInternalInstance) { 
  setupStatefulComponent(instance)
}
// 设置一个有状态的组件实例
function setupStatefulComponent(instance: ComponentInternalInstance) {
  const { props, children } = instance.vnode
  // 初始化组件实例的props
  initProps(instance, props)
  // 初始化组件实例的插槽
  initSlots(instance, children)
  // 获取组件的构造函数
  const Component = instance.type
  // 创建组件实例的代理对象
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

  // 获取组件实例的setup函数
  const { setup } = Component
  if (setup) {
    // 创建组件实例的上下文对象
    const setupContext = createSetupContext(instance)
    // 设置当前组件实例
    setCurrentInstance(instance)
    // 执行setup函数，返回setup函数的返回值
    const setupResult = setup(instance.props, setupContext)
    // 重置当前组件实例
    setCurrentInstance(null)
    // 如果 setup 的返回值是函数，则将返回值作为组件的 render 函数
    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else {
      instance.setupState = proxyRefs(setupResult)
    }
  }

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
// 定义组件实例
export let currentInstance: ComponentInternalInstance | null = null
// 获取当前组件实例
export const getCurrentInstance: () => ComponentInternalInstance | null = () => {
  return currentInstance
}
// 设置当前组件实例
export function setCurrentInstance(instance: ComponentInternalInstance) {
  currentInstance = instance
  return () => (currentInstance = null)
}
export function createSetupContext(instance: ComponentInternalInstance): SetupContext {
  const expose: SetupContext['expose'] = exposed => {
    instance.exposed = exposed || {}
  }

  const emit = (event, ...args) => {
    // 判断event 是驼峰还是短横线分割的
    const name = camelize(event)
    const eventName = `on${name[0].toUpperCase()}${name.slice(1)}` // myClick ==> onMyClick
    const handler = instance.vnode.props[eventName]
    handler && handler(...args)
  }

  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit,
    expose,
  }
}