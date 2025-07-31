export enum ShapeFlags {
  ELEMENT = 1, // 元素
  FUNCTIONAL_COMPONENT = 1 << 1, // 函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 有状态组件
  TEXT_CHILDREN = 1 << 3, // 文本子节点
  ARRAY_CHILDREN = 1 << 4, // 数组子节点
  SLOTS_CHILDREN = 1 << 5, // 插槽子节点
  TELEPORT = 1 << 6, // teleport
  SUSPENSE = 1 << 7, // suspense
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // 组件应该被缓存
  COMPONENT_KEPT_ALIVE = 1 << 9,// 组件已经被缓存
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 组件
}

// 如何理解位运算:
// 1 << 1 = 1 * 2^1 = 2
// 二进制表示:
// 1 << 1 = 00000001 * 2^1 = 00000010 = 2

// 举例:
// ShapeFlags.ELEMENT | ShapeFlags.FUNCTIONAL_COMPONENT = 1 | 2 = 00000001 | 00000010 = 00000011 = 3
// 表示元素和函数式组件, 大的和小的做或运算,表示组合了两个类型,即是元素又是函数式组件
// ShapeFlags.COMPONENT & ShapeFlags.FUNCTIONAL_COMPONENT = 3 & 2 = 00000011 & 00000010 = 00000010 = 2 
// 表示函数式组件,大的和小的做与运算,如果结果大于0,则说明小的在大的里面,如果结果为0,则说明小的不在大的里面