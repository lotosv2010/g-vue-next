// 判断是否是函数
export const isFunction = (val: any) => typeof val === 'function'
// 判断是否是对象
export const isObject = (val: any) => val !== null && typeof val === 'object'
// 判断是否发生改变
export const hasChanged = (value: any, oldValue: any) => !Object.is(value, oldValue)
// 合并对象
export const extend: typeof Object.assign = Object.assign
// 判断是否为数组
export const isArray = Array.isArray
// 创建一个空函数
export const NOOP = () => {}
// 判断是否为on开头
export const isOn = (key: string) => 
  key.charCodeAt(0) === 111 && // o
  key.charCodeAt(1) === 110 && // n
  (key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97) // [a-z]
// 判断是否为字符串
export const isString = (val: unknown): val is string => typeof val === 'string'
// 判断是否为null或者undefined
export const isNil = (val: unknown): val is null | undefined => val == null
// 创建一个空对象
export const EMPTY_OBJ = {}
// 获取对象的属性
export const ownProperty = Object.prototype.hasOwnProperty
// 判断对象中是否有某个属性
export const hasOwn = (val: object, key: string) =>
  ownProperty.call(val, key)
// 驼峰命名 
const camelizeRE = /-(\w)/g
export const camelize = (str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
}
// 横线命名
const hyphenateRE = /\B([A-Z])/g
export const hyphenate = (str: string) =>
  str.replace(hyphenateRE, '-$1').toLowerCase()