import { isArray, isObject } from '@g-vue-next/shared'
import { createVNode, isVNode, type VNode, type VNodeArrayChildren } from './vnode'

export type RawChildren =
  | string
  | number
  | boolean
  | VNode
  | VNodeArrayChildren
  | (() => any)

export function h(
  type: string | any, 
  propsOrChildren?: Record<string, unknown> | null, 
  children?: RawChildren
) {
  const l = arguments.length

  // 分析 l 的值的情况:
  // 1. 2个参数
  //   如: h('div', { id: 'foo' }), h('div', 'hello world'), h('div', [h('span', 'hello'), h('span', 'world')])
  // 2. 3个参数
  //   如: h('div', { id: 'foo' }, 'hello world'), h('div', { id: 'foo' }, [h('span', 'hello'), h('span', 'world')])
  // 3. 大于3个参数
  //   如: h('div', { id: 'foo' }, 1, '2', h('span', 'hello'), h('span', 'world'))

  if (l === 2) { 
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) { // propsOrChildren 是对象，且不是数组
      if (isVNode(propsOrChildren)) { // propsOrChildren 是虚拟节点, 如: h('div', h('span', 'hello'))
        return createVNode(type, null, [propsOrChildren])
      }
      // 对象, 如: h('div', { id: 'foo' })
      return createVNode(type, propsOrChildren)
    } else {
      // 数组或文本, 如: h('div', ['hello', h('span', 'world')]), h('div', 'hello world')
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if(l > 3) { // 如: h('div', { id: 'foo' }, 1, '2', h('span', 'hello'), h('span', 'world'))
      children = Array.from(arguments).slice(2)
    } else if(l === 3 && isVNode(children)) { // 如: h('div', { id: 'foo' }, h('span', 'hello'))
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}