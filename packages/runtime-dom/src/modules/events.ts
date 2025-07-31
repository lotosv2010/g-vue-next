import { isArray } from "@g-vue-next/shared"

interface Invoker extends EventListener {
  value: EventValue
  attached?: number
}

type EventValue =Function | Function[]

const veiKey = Symbol('_vei')

export function patchEvent(
  el: Element & {[veiKey]?: Record<string, any>},
  rawName: string,
  prevValue: EventValue,
  nextValue: EventValue,
  instance: any = null,
) { 
  // 用来缓存事件监听器
  const invokers = el[veiKey] || (el[veiKey] = {})
  // 获取事件名称，如：onClick => click
  const name = (rawName.slice(2) as string).toLocaleLowerCase()
  // 获取对应name的缓存事件
  const existingInvoker = invokers[name]

  // 如果新的事件存在并且缓存的事件也存在，则更新缓存的事件
  if(nextValue && existingInvoker) {
    //! 这里使用了一个技巧，将缓存的事件的value属性设置为新的事件，这样，当缓存的事件被触发时，就会执行新的事件
    existingInvoker.value = nextValue
  } else {
    // 有新事件，无旧事件：绑定事件，缓存事件
    if (nextValue) {
      const invoker = (invokers[name] = createInvoker(nextValue, instance))
      addEventListener(el, name, invoker)
      invoker.value = nextValue
    } else if (existingInvoker) {
      // 无新事件，有旧事件：删除旧事件，缓存事件不存在
      removeEventListener(el, name, existingInvoker)
      invokers[name] = null
    }
  }
}

function createInvoker(
  initialValue: EventValue,
  instance: any
) {
  const invoker: Invoker = (e: Event) => {
    if(isArray(invoker.value)) {
      invoker.value.forEach(fn => fn(e))
    } else {
      invoker.value(e)
    }
  }
  invoker.value = initialValue
  return invoker
}

export function addEventListener(el: Element, name: string, handler: EventListener, options?: EventListenerOptions) {
  el.addEventListener(name, handler, options)
}

export function removeEventListener(el: Element, name: string, handler: EventListener, options?: EventListenerOptions) {
  el.removeEventListener(name, handler, options)
}