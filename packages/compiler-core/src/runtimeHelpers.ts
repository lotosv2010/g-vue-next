// 注释节点
export const CREATE_COMMENT = Symbol('createCommentVNode')
// 转换文本节点
export const TO_DISPLAY_STRING = Symbol('toDisplayString')
// 创建文本节点
export const CREATE_TEXT = Symbol('createTextVNode')
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')
export const CREATE_VNODE = Symbol('createVNode')
export const RESOLVE_COMPONENT = Symbol('resolveComponent')
export const OPEN_BLOCK = Symbol('openBlock')
export const CREATE_BLOCK = Symbol('createBlock')
export const CREATE_ELEMENT_BLOCK = Symbol('createElementBlock')
export const WITH_DIRECTIVES = Symbol('withDirectives')
export const FRAGMENT = Symbol('Fragment')

export const helperNameMap = {
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_COMMENT]: 'createCommentVNode',
  [CREATE_TEXT]: 'createTextVNode',
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [CREATE_VNODE]: 'createVNode',
  [RESOLVE_COMPONENT]: 'resolveComponent',
  [OPEN_BLOCK]: 'openBlock',
  [CREATE_BLOCK]: 'createBlock',
  [CREATE_ELEMENT_BLOCK]: 'createElementBlock',
  [WITH_DIRECTIVES]: 'withDirectives',
  [FRAGMENT]: 'Fragment',
}