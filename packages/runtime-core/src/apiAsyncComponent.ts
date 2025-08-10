import { isFunction, isNil } from "@g-vue-next/shared";
import { Component, ComponentInternalInstance, currentInstance } from "./component";
import { createVNode } from "./vnode";
import { ref } from "@g-vue-next/reactivity";

export type AsyncComponentResolveResult<T = Component> = T | { default: T}

export type AsyncComponentLoader<T = any> = () => Promise<AsyncComponentResolveResult<T>>

export interface AsyncComponentOptions<T = any> {
  loader: AsyncComponentLoader<T>
  loadingComponent?: Component
  errorComponent?: Component
  delay?: number
  timeout?: number
  suspensible?: boolean
  onError?: (
    error: Error, 
    retry: () => void, 
    fail: () => void, 
    attempts: number
  ) => void
}

export function defineAsyncComponent<T extends Component > (
  source: AsyncComponentLoader<T> | AsyncComponentOptions<T>
): T {
  if (isFunction(source)) {
    source = { loader: source as any };
  }

  const {
    loader,
    loadingComponent,
    errorComponent,
    timeout,
    delay = 200,
    suspensible = true,
    onError: userOnError
  } = source as any

  let resolvedComp = null
  let pendingRequest = null
  let retries = 0
  let timer: any

  const retry = () => {
    retries++
    pendingRequest = null
    return load()
  }

  const load = (): Promise<any> => {
    let thisRequest
    return (pendingRequest || (thisRequest = pendingRequest = 
      loader()
      .catch(err => {
        err = err instanceof Error ? err : new Error(String(err))
        if (userOnError) {
          return new Promise((resolve, reject) => {
            const userRetry = () => resolve(retry())
            const userFail = () => reject(err)
            userOnError(err, userRetry, userFail, retries + 1)
          })
        } else {
          throw err
        }
      })
      .then(comp => {
        // 如果当前的请求和 pendingRequest不一样，则舍弃
        if (thisRequest !== pendingRequest && pendingRequest) {
          return pendingRequest
        }
        if (comp && (comp.__esModule || comp[Symbol.toStringTag] === 'Module')) {
          comp = comp.default
        }
        resolvedComp = comp
        return comp
      })
      .finally(() => {
        clearTimeout(timer)
        pendingRequest = null
      })
    ))
  }
  return {
    name: 'AsyncComponentWrapper',
    __asyncLoader: load,
    get __asyncResolved () {
      return resolvedComp
    },
    setup() {
      const instance = currentInstance
      if (resolvedComp) {
        return () => createInnerComp(resolvedComp, instance)
      }

      const loaded = ref(false)
      const error = ref(undefined)
      const delayed = ref(!!delay)

      if (delay) {
        setTimeout(() => {
          delayed.value = false
        }, delay);
      }

      if (!isNil(timeout)) {
        timer = setTimeout(() => {
          if (!loaded.value && !error.value) {
            const err = new Error(`Async component timed out after ${timeout}ms.`)
            error.value = err
          }
        }, timeout)
      }

      load()
        .then((comp) => {
          loaded.value = true
          resolvedComp = comp
        })
        .catch(err => {
          error.value = err
        })
      return () => {
        if (loaded.value && resolvedComp) {
          return createInnerComp(resolvedComp, instance)
        } else if (error.value && errorComponent) {
          return createVNode(errorComponent, {
            error: error.value
          })
        } else if (loadingComponent && !delayed.value) {
          return createVNode(loadingComponent)
        }
      }
    }
  } as any
}

function createInnerComp(comp: any, parent: ComponentInternalInstance) {
  const { ref, props, children } = parent.vnode
  const vnode = createVNode(comp, props, children)
  vnode.ref = ref
  return vnode
}