import { RendererOptions } from "@g-vue-next/runtime-core"

const doc = (typeof document !== 'undefined' ? document : null) as Document

// 所有的DOM操作都放在这里面
export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null)
  },
  remove(child) {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  createElement(tagName) {
    return doc.createElement(tagName)
  },
  createText(text) {
    return doc.createTextNode(text)
  },
  createComment(text) {
    return doc.createComment(text)
  },
  setText(node, text) { // 设置文本节点的值
    node.nodeValue = text
  },
  setElementText(node, text) { // 设置元素节点的文本
    node.textContent = text
  },
  parentNode(node) {
    return node.parentNode as Element | null
  },
  nextSibling(node) {
    return  node.nextSibling
  },
  querySelector(selector) {
    return doc.querySelector(selector)
  },
  setScopeId(el, id) {
    el.setAttribute(id, '')
  },
  insertStaticContent(content, parent, anchor, namespace, start, end) {
    const before = anchor ? anchor.previousSibling : parent.lastChild
    return [
      // first
      before? before.nextSibling : parent.firstChild,
      // last
      anchor ? anchor.previousSibling : parent.lastChild
    ]
  }
}