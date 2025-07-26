// 判断是否是函数
export const isFunction = (val: any) => typeof val === 'function'
// 判断是否是对象
export const isObject = (val: any) => val !== null && typeof val === 'object'