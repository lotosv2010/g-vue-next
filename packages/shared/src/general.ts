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