import { RendererOptions } from "@g-vue-next/runtime-core";
import { isOn } from "@g-vue-next/shared";
import { patchClass } from "./modules/class";
import { patchStyle } from "./modules/style";
import { patchEvent } from "./modules/events";
import { patchAttr } from "./modules/arrts";

type DOMRendererOptions = RendererOptions<Node, Element>

export const patchProp: DOMRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
  namespace,
  parentComponent
) => {
  if (key === 'class') {
    patchClass(el, nextValue || '')
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
    patchEvent(el, key, prevValue, nextValue, parentComponent)
  } else { // attr
    patchAttr(el, key, nextValue)
  }
}