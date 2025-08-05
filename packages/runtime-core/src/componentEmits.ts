import { camelize, EMPTY_OBJ, toHandlerKey } from "@g-vue-next/shared";
import { ComponentInternalInstance } from "./component";

export function emit(
  instance: ComponentInternalInstance,
  event: string,
  ...rawArgs: any[]
) {
  if (instance.isUnmounted) return
  // 获取组件
  const props = instance.vnode.props || EMPTY_OBJ
  const args = rawArgs
  const handler = props[toHandlerKey(camelize(event))]
  handler && handler(...args)
}