import { effect } from './reactivity'
import { nodeOps } from './runtime-dom'
export * from './reactivity'
export function render(vnode, container) {
  // vue 渲染页面用的方法叫 patch
  // 1.初次渲染 2.dom-diff
  patch(container._vnode, vnode, container)
  // 上次渲染的虚拟节点
  container._vnode = vnode
}

/**
 * 更新视图
 * @param {老的虚拟节点} n1 
 * @param {新的虚拟节点} n2 
 * @param {容器} container 
 */
function patch(n1, n2, container, anchor) {
  // 组件的虚拟节点 tag 是一个对象
  // 如果是组件 tag 可能是一个对象
  if(typeof n2.tag === 'string') {
    // 标签
    // mountElement(n2, container)
    // 1.初次渲染 2.diff操作
    processElement(n1, n2, container, anchor)
  } else if(typeof n2.tag === 'object') {
    // 组件渲染
    mountComponent(n2, container)
  }
}

function mountElement(vnode, container, anchor) {
  const { tag, children, props } = vnode
  // 将虚拟节点和真实节点创造映射关系
  let el = (vnode.el = nodeOps.createElement(tag))
  // 属性操作
  if(props) {
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        nodeOps.hostPatchProps(el, key, {},props[key])
      }
    }
  }
  if(Array.isArray(children)) {
    mountChildren(children, el)
  } else {
    nodeOps.hostSetElementText(el, children)
  }
  nodeOps.insert(el, container, anchor)
}

function mountChildren(children, container) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    patch(null, child, container) // 递归挂载孩子
  }
}

function mountComponent(vnode, container) {
  // 根据组件创建一个实例
  const instance = {
    vnode,
    render: null, // 当前setup的返回值
    subTree: null, // render方法的返回的结果
  }
  const Component = vnode.tag
  instance.render = Component.setup(vnode.props, instance)
  
  // 每个组件都有一个effect 用于局部重新渲染
  effect(() => { // 渲染时只收集自己，防止收集父级
    // 如果返回的是对象 template => render方法，把render方法再挂载到对象上
    // 这里可以做vue2兼容，拿到vue2中options API 和 setup 的返回值做合并
    instance.subTree = instance.render && instance.render()
    patch(null, instance.subTree, container)
  })
}

function processElement(oldVnode, newVnode, container, anchor) {
  if(oldVnode == null) { // 初次渲染
    mountElement(newVnode, container, anchor)
  } else { // diff操作
    patchElement(oldVnode, newVnode, container)
  }
}

function patchElement(oldVnode, newVnode, container) {
  if(oldVnode.tag !== newVnode.tag) {
    nodeOps.remove(oldVnode.el) // 删除老的节点
    mountElement(newVnode, container)
    return
  }
  // 如果 oldVnode 和 newVnode 是否一样，考虑key，不考虑没有key的情况
  let el = newVnode.el = oldVnode.el // 节点一样就复用
  const oldProps = oldVnode.props
  const newProps = newVnode.props
  pathProps(el, oldProps, newProps)

  // 比对元素的孩子
  patchChildren(oldVnode, newVnode, el)
}

function pathProps(el, oldProps, newProps) {
  if(oldProps !== newProps) {
    // 比较属性
    // 1.将新的属性全部设置，以新的为准
    for (const key in newProps) {
      const n = newProps[key]
      const o = oldProps[key]
      if(n !== o) { // 老的和新的不一样，以新的为准
        nodeOps.hostPatchProps(el, key, o, n)
      }
    }
    // 2.老的里面有的，新的没有的需要删除
    for (const key in oldProps) {
      if (!newProps.hasOwnProperty(key)) { // 新的里面没有，需要清空老的
        nodeOps.hostPatchProps(el, key, oldProps[key], null)
      }
    }
  }
}

function patchChildren(oldVnode, newVnode, container) {
  const c1 = oldVnode.children
  const c2 = newVnode.children
  // 可能有多个孩子，另一方没有儿子
  if(typeof c2 === 'string') {
    if(c1 !== c2) {
      // 直接替换
      nodeOps.hostSetElementText(container, c2)
    }
  } else {
    // c2是数组
    if(typeof c1 === 'string') {
      // 先删除c1中原有内容，出阿茹新内容
      nodeOps.hostSetElementText(container, '')
      mountChildren(c2, container)
    } else {
      patchKeyedChildren(c1, c2, container)
    }
  }
  // 可能没有儿子，另一方有多个孩子
  // 两方都有儿子
}

// 有key做diff操作，没key直接覆盖或复用
function patchKeyedChildren(c1, c2, container) {
  // 1.最长递增子序列 LIS
  // [2, 5, 9, 6, 4, 7, 2, 7, 2]
  // [2, 5, 6, 7]
  // [2, 4, 6, 7]
  let e1 = c1.length - 1 // 老的最后一项的索引
  let e2 = c2.length - 1 // 新的最后一项的索引
  // 2.diff算法
  // 内部有优化：头头比较、尾尾比较、头尾、尾头
  const keyedToNewIndexMap = new Map()
  // 2.1 根据新节点生成一个key => index的映射表
  for (let i = 0; i <= e2; i++) {
    const currentEle = c2[i] // 获取每一项
    keyedToNewIndexMap.set(currentEle.props.key, i)
  }
  console.log(keyedToNewIndexMap)
  // 2.2 去老的里面找看看有没有对应的，如果有一样的就复用
  const newIndexToOldIndexMap = new Array(e2 + 1) // 标识, [-1,-1,-1,.....]
  for (let i = 0; i <= e2; i++) {
    newIndexToOldIndexMap[i] = -1
  }
  for (let i = 0; i <= e1; i++) {
    const oldVnode = c1[i]
    // 新的索引
    let newIndex = keyedToNewIndexMap.get(oldVnode.props.key) 
    if(newIndex == undefined) { // 老的有新的没有，删除老的节点
      nodeOps.remove(oldVnode.el)
    } else { // 新的有，老的有，复用
      // 这里+1是因为 getSequence 算法内部没有考虑值为0的情况
      newIndexToOldIndexMap[newIndex] = i + 1
      patch(oldVnode, c2[newIndex], container) // 递归，比较儿子和标签属性
    }
  }
  console.log(newIndexToOldIndexMap)

  let sequence = getSequence(newIndexToOldIndexMap)
  let j = sequence.length - 1 // 获取最后的索引
  // 以上的方法仅仅是比对和删除无用节点，没有移动操作
  // 接下来我们要移动，从后往前插入
  for (let i = e2; i >=0; i--) {
    let currentEle = c2[i]
    const anchor = i + 1 <= e2 ? c2[i + 1].el : null
    // 有可能新的比老的多，[A, B] => [A, B, C, D]
    if(newIndexToOldIndexMap[i] === -1) {
      // 这是一个新元素，需要插入到列表中
      // 插入某个容器的前面，而不是放到容器的后面
      patch(null, currentEle, container, anchor)
    } else {
      // 移动
      // 获取不需要移动的最长个数，[q, a, b, c] [e, a, b, c, q] => [a, b, c] 最长
      // 根据最长递增子序列来确定不需要移动的元素，直接跳过即可
      console.log(i, j, sequence[j])
      if(i == sequence[j]) {
        j--
      } else {
        nodeOps.insert(currentEle.el, container, anchor)
      }
    }
  }

  // 2.3 新的比老的多 => 添加， 老的比新的多 => 删除
  // 2.4 两个 key 一样，比较属性，移动
}
// 返回最长递增子序列的索引
function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
