import { ShapeFlags } from "@g-vue-next/shared";
import { VNode, VNodeNormalizedRef, VNodeNormalizedRefAtom } from "./vnode";
import { getComponentPublicInstance } from "./component";
import { isRef } from "@g-vue-next/reactivity";

export function setRef(
  rawRef: VNodeNormalizedRef,
  oldRawRef: VNodeNormalizedRef | null,
  parentSuspense: any | null,
  vnode: VNode,
  isUnmount = false
) {
  const refValue = 
    vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
      ? getComponentPublicInstance(vnode.component!)
      : vnode.el;
  const value = isUnmount ? null : refValue;
  const { i: owner, r: ref } = rawRef as VNodeNormalizedRefAtom;

  if (isRef(ref)) {
    ref.value = value;
  }
}