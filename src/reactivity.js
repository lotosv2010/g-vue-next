let activeEffect
export function effect(fn) {
  // 默认effect 需要先执行一次
  activeEffect = fn // 存储fn方法，数据变化，重新调用方法
  fn()
  activeEffect = null // 页面渲染完毕清空effect
}

// 默认只代理第一层
// 懒代理
export function reactive(target) {
  return new Proxy(target, { // proxy 不用重写每一个属性
    set(target, key, value, receiver) { // 拦截器，性能更高，兼容性差
      // target[key] = value
      const res = Reflect.set(target, key, value, receiver)
      // res && activeEffect() // 重新渲染
      // 触发更新，重新渲染
      trigger(target, key)
      // proxy 中 set 方法需要有返回值
      return res
    },
    get(target, key, receiver) {
      // if(typeof target[key] === 'object') {
      //   return reactive(target[key]) // 每次获取数据时，再递归代理
      // }

      const res = Reflect.get(target, key, receiver) // 等价于 target[key]
      // 收集依赖，只有在页面中取值时才会做依赖收集
      track(target ,key)
      return res
    }
  })
}

// 依赖收集要确定的是某个属性变了要更新，而不是整个对象，一个属性要收集对应的effect
const targetMap = new WeakMap() // 相当于 vue2 Dep
function track(target, key) {
  // 数据结构
  /*
  { // WeakMap
    { name: 'robin', age: 18 }: {
      name: [effect, effect], // Map: Set
      age: [effect, effect]
    }
  }
  */

  // 注意 target key 可能对应多个 effect
  let depsMap = targetMap.get(target)
  if(!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if(!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  // 如果 存在要收集的函数，则添加到 Set 中
  if(activeEffect && !deps.has(activeEffect)) {
    deps.add(activeEffect)
  }
  console.log(targetMap)
}
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if(!depsMap) return
  const effects = depsMap.get(key)
  effects && effects.forEach(effect => {
    effect()
  })
}