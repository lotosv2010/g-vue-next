import { isRef, type Ref } from "@g-vue-next/reactivity";
import type { RendererElement, RendererNode } from "./renderer";
import { isArray, isFunction, isObject, isOn, isString, normalizeClass, normalizeStyle, ShapeFlags } from "@g-vue-next/shared";
import { Component, ComponentInternalInstance, currentInstance } from "./component";
import { RawSlots } from "./componentSlots";

type Data = Record<string, unknown>;
export type VNodeRef = 
  | string
  | Ref
  | ((ref: Element | null, refs: Record<string, any>) =>void)

export type VNodeProps = { 
  key?: PropertyKey,
  ref?: VNodeRef
  ref_for?: boolean
  ref_key?: string
}

export type VNodeTypes = 
  | string
  | Component
  | VNode
  | typeof Text
  | typeof Comment
  | typeof Fragment

export type VNodeChildAtom = 
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | void

export type VNodeArrayChildren = Array<VNodeArrayChildren | VNodeChildAtom>

export type VNodeChild = VNodeChildAtom | VNodeArrayChildren

export type VNodeNormalizedChildren = 
  | string
  | VNodeArrayChildren
  | RawSlots
  | null

export type VNodeNormalizedRefAtom = {
  i: ComponentInternalInstance,
  r: VNodeRef,
  k?: string,
  f?: boolean
}

export type VNodeNormalizedRef = 
  | VNodeNormalizedRefAtom
  | VNodeNormalizedRefAtom[]

export interface VNode<
  HostNode = RendererNode,
  HostElement = RendererElement,
  ExtraProps = { [key: string]: any }
> {
  // core
  __v_isVNode: true;
  type: VNodeTypes;
  key: PropertyKey | null
  props: (VNodeProps & ExtraProps) | null
  ref: VNodeNormalizedRef | null

  children: VNodeNormalizedChildren
  component: ComponentInternalInstance | null
  // DOM
  el: HostNode | null
  anchor: HostNode | null
  
  // optimization
  shapeFlag: number
}

const normalizeKey = ({ key }: VNodeProps): VNodeProps['key'] => 
  key != null ? key : null
const normalizeRef = ({
  ref,
  ref_key,
  ref_for,
}: VNodeProps): VNodeNormalizedRefAtom | null => {
  if (typeof ref === 'number') {
    ref = '' + ref
  }
  return (ref != null
    ? isString(ref) || isRef(ref) || isFunction(ref)
      ? { i: currentInstance, r: ref, k: ref_key, f: !!ref_for }
      : ref
    : null
  ) as any
}

function createBaseVNode(
  type: VNodeTypes,
  props: (VNodeProps | Record<string, unknown>) | null = null,
  children: unknown = null,
  shapeFlag: number = type === Fragment ? 0 : ShapeFlags.ELEMENT
) {
  const vnode = {
    __v_isVNode: true,
    type, // 类型
    props, // 属性
    children, // 子节点
    component: null, // 组件实例
    shapeFlag, // 元素节点的标识
    el: null, // 虚拟节点对应的真实元素节点
    key: props && normalizeKey(props), // 虚拟节点的key
    ref: props && normalizeRef(props),
  } as VNode

  // 如果有子节点，则标记子节点的类型
  if(children) {
    // 获取子节点的类型
    let type = 0
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN // 数组
    } else if(isObject(children)) {
      type = ShapeFlags.SLOTS_CHILDREN; // 插槽
    } else {
      type = ShapeFlags.TEXT_CHILDREN // 文本
    }
    // 按位或运算，将type的值添加到shapeFlag中
    vnode.shapeFlag |= type 
  }

  return vnode
}

function _createVNode(
  type: VNodeTypes,
  props: (VNodeProps | Record<string, unknown>) | null = null,
  children: unknown = null
): VNode {
  const shapeFlag = isString(type) // 元素节点
    ? ShapeFlags.ELEMENT
    : isObject(type) // 组件节点
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type) // 函数式组件节点
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0
  return createBaseVNode(type, props, children, shapeFlag)
}

export const Text = Symbol.for('v-text')
export const Comment = Symbol.for('v-cmt')
export const Fragment = Symbol.for('v-fgt')

// 判断两个节点是否相同
export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key
}

export const isVNode = (value: any): value is VNode => {
  return value ? value.__v_isVNode === true : false
}

export const normalizeVNode = (child: VNodeChild): VNode => {
  // child 是 false 或 null, 返回一个空节点
  if (child == null || typeof child === 'boolean') { 
    return createVNode(Comment)
  } else if (isArray(child)) {
    return createVNode(
      Fragment as any,
      null,
      child.slice()
    )
  } else if (isObject(child)) {
    return child as VNode
  } else {
    return createVNode(Text, null, String(child))
  }
}

export function mergeProps(...args: (Data & VNodeProps)[]) {
  const ret: Data = {}
  for (let i = 0; i < args.length; i++) {
    const toMerge = args[i]
    for (const key in toMerge) {
      if (key === 'class') {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class])
        }
      } else if (key === 'style') {
        ret.style = normalizeStyle([ret.style, toMerge.style])
      } else if (isOn(key)) {
        const existing = ret[key]
        const incoming = toMerge[key]
        if (
          incoming &&
          existing !== incoming &&
          !(isArray(existing) && existing.includes(incoming))
        ) {
          ret[key] = existing
            ? [].concat(existing as any, incoming as any)
            : incoming
        }
      } else if (key !== '') {
        ret[key] = toMerge[key]
      }
    }
  }
  return ret
}

export const createVNode = _createVNode