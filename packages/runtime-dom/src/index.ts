import { createRenderer, Renderer, RootRenderFunction } from '@g-vue-next/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { extend } from '@g-vue-next/shared'

// 合并节点操作和属性操作
export const rendererOptions = extend(nodeOps, { patchProp }) // 合并nodeOps和patchProp
let renderer: Renderer<Element>

function ensureRenderer() {
  return renderer || createRenderer<Node, Element>(rendererOptions)
}

export const render = ((...args) => {
  return ensureRenderer().render(...args)
}) as RootRenderFunction<Element>

export * from '@g-vue-next/runtime-core'
export * from './components/Transition'