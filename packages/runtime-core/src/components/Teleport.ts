import { ShapeFlags } from "@g-vue-next/shared"
import { type RendererNode, type RendererElement, type ElementNamespace, type RendererInternals, MoveType } from "../renderer"
import type { VNode, VNodeProps } from "../vnode"

export type TeleportVNode = VNode<RendererNode, RendererElement, TeleportProps>

export type TeleportProps = {
  to: string | RendererElement | null | undefined
  disabled?: boolean
}
export const TeleportEndKey = Symbol('_vte')

export type TeleportImplComp = {
  name: 'Teleport'
  __isTeleport: true
  process(
    n1: TeleportVNode | null,
    n2: TeleportVNode,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: any,
    parentSuspense: any,
    slotScopeIds: string[] | null,
    optimized: boolean,
    namespace: ElementNamespace,
    internals: RendererInternals
  ): void
  remove(
    vnode: VNode,
    parentComponent: any,
    parentSuspense: any,
    internals: RendererInternals,
    doRemove?: boolean
  ): void
  new (): {
    $props: VNodeProps & TeleportProps
    $slots: {
      default(): VNode[]
    }
  }
}
export const TeleportImpl = {
  name: 'Teleport',
  __isTeleport: true,
  process(
    n1: TeleportVNode | null,
    n2: TeleportVNode,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: any,
    parentSuspense: any,
    slotScopeIds: string[] | null,
    optimized: boolean,
    namespace: ElementNamespace,
    internals: RendererInternals
  ) {
    const {
      mc: mountChildren,
      pc: patchChildren,
      m: move,
      o: { insert, querySelector, createText, createComment }
    } = internals
    const { shapeFlag, children } = n2

    // 如果 n1 不存在，则说明是初次渲染
    if (!n1) {
      const target = (n2.target = querySelector(n2.props.to as string))
      if (target) {
        mountChildren(n2.children as any, target, null, parentComponent, parentSuspense, namespace)
      }
    } else {
      patchChildren(n1, n2, n1.target, anchor, parentComponent, parentSuspense, namespace)
      n2.target = n1.target

      if (n2.props.to !== n1.props.to) {
        const nextTarget: any = querySelector(n2.props.to as string)
        if (nextTarget) {
          n2.target = nextTarget;
          (n2.children as VNode[]).forEach(c => {
            move(c, nextTarget, anchor, MoveType.LEAVE)
          });
        }
      }
    }
  },
  remove(
    vnode: VNode,
    parentComponent: any,
    parentSuspense: any,
    internals: RendererInternals,
    doRemove?: boolean
  ) {
    const { um: unmount } = internals
    const { shapeFlag, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      ((children || []) as VNode[]).forEach(c => unmount(c, parentComponent, parentSuspense, true))
    }
  }
} as unknown as TeleportImplComp

export const Teleport: TeleportImplComp = TeleportImpl

export const isTeleport = (type: any): boolean => type.__isTeleport