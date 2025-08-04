import { Data } from "./component"
import { VNode } from "./vnode"

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