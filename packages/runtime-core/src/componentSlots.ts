import { ShapeFlags } from "@g-vue-next/shared";
import { ComponentInternalInstance } from "./component";
import { VNodeArrayChildren, VNodeNormalizedChildren } from "./vnode";

export type RawSlots = {
  [name: string]: unknown
  $stable?: boolean
  _ctx?: any | null
  _?: any
}
export const initSlots = (
  instance: ComponentInternalInstance,
  children: VNodeNormalizedChildren
) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children as any
  }
}

export const updateSlots = (
  instance: ComponentInternalInstance,
  children: VNodeNormalizedChildren
) => {
  Object.assign(instance.slots, children)
}