// 判断是否是函数
export const isFunction = (val: any) => typeof val === 'function'
// 判断是否是对象
export const isObject = (val: any) => val !== null && typeof val === 'object'
// 判断是否发生改变
export const hasChanged = (value: any, oldValue: any) => !Object.is(value, oldValue)
// 合并对象
export const extend = Object.assign