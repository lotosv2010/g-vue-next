// 内部对象
const internalObjectProto = {}
// 创建一个内部对象
export const createInternalObject = () => Object.create(internalObjectProto)
// 判断是否是一个内部对象
export const isInternalObject = (obj: object) => Object.getPrototypeOf(obj) === internalObjectProto