import { ShapeFlags } from "@g-vue-next/shared"
import { ComponentInternalInstance, Data } from "./component"
import { Comment, createVNode, normalizeVNode, VNode } from "./vnode"

export function shouldUpdateComponent(
  prevVNode: VNode,
  nextVNode: VNode
) {
  const { props: prevProps, children: prevChildren } = prevVNode
  const { props: nextProps, children: nextChildren } = nextVNode

  // 如果有插槽则直接重新渲染
  if (prevChildren || nextChildren) {
    return true
  }
  if (prevProps === nextProps) {
    return false
  }
  if (!prevProps) {
    return !!nextProps
  }
  if (!nextProps) {
    return true
  }
  return hasPropsChanged(prevProps, nextProps)
}

export function hasPropsChanged(
  prevProps: Data,
  nextProps: Data
) {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)
  if (prevKeys.length !== nextKeys.length) {
    return true
  }
  for (const key in nextProps) {
    return prevProps[key] !== nextProps[key]
  }
  return false
}

export function renderComponentRoot(
  instance: ComponentInternalInstance
): VNode {
  const { render, vnode, proxy, props, type: Component, attrs } = instance
  let result
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      result = normalizeVNode(render.call(proxy, proxy))
    } else {
      const render = Component as Function
      const hasProps = Object.keys(props ?? {}).length > 0
      result = normalizeVNode(render(hasProps ? props : attrs, null))
    }
  } catch (error) {
    result = createVNode(Comment)
    console.error(error)
  }
  return result
}