import { ElementNamespace, MoveType, RendererElement, RendererInternals, RendererNode } from "../renderer"
import { ComponentInternalInstance, currentInstance, getComponentName, getCurrentInstance, SetupContext } from "../component"
import { Comment, isSameVNodeType, isVNode, type VNode, type VNodeProps } from "../vnode"
import { invokeArrayFns, isArray, isNil, isRegExp, isString, ShapeFlags } from "@g-vue-next/shared"
import { onUpdated, onMounted, onBeforeUnmount, createHook, injectHooks } from "../apiLifecycle"
import { LifecycleHooks } from "../enums"

type MatchPattern = string | RegExp | (string | RegExp)[]
type CacheKey = PropertyKey | any
type Cache = Map<CacheKey, VNode>
type Keys = Set<CacheKey>

export interface KeepAliveProps {
  include?: MatchPattern
  exclude?: MatchPattern
  max?: number
}

export interface KeepAliveContext {
  renderer: RendererInternals
  activate: (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null,
    namespace: ElementNamespace,
    optimized: boolean
  ) => void
  deactivate: (vnode: VNode) => void
}

function resetShapeFlag(vnode: VNode) {
  // 重置ShapeFlags.KeepAlive位
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE 
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE
}

function getInnerChild(vnode: VNode): VNode {
  return vnode.shapeFlag & ShapeFlags.SUSPENSE
    ? vnode.ssContent
    : vnode
}

function matches(pattern: MatchPattern, name: string): boolean {
  if (isArray(pattern)) {
    return pattern.some((p) => matches(p, name))
  } else if (isString(pattern)) {
    return pattern.split(",").includes(name)
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  return false
}

let current: VNode | null = null

const KeepAliveImpl = {
  name: 'KeepAlive',
  __isKeepAlive: true,
  props: {
    include: [String, RegExp, Array],
    exclude: [String, RegExp, Array],
    max: [String, Number]
  },
  setup(props: KeepAliveProps, { slots }: SetupContext) {
    // 缓存的key
    const keys: Keys = new Set()
    // 缓存的组件
    let cache: Cache = new Map()
    // 获取组件实例
    const instance = getCurrentInstance()
    // 由于类型不兼容，先断言为 unknown 再断言为 KeepAliveContext
    const sharedContext = instance.ctx as unknown as KeepAliveContext
    // 获取组件的 Suspense 实例
    const parentSuspense = instance.suspense
    // 获取渲染器
    const {
      renderer: {
        p: patch,
        m: move,
        um:_unmount,
        o: {
          createElement
        }
      }
    } = sharedContext
    // 新建缓存容器
    const storageContainer = createElement('div')
    sharedContext.activate = (vnode, container, anchor, namespace) => { 
      const instance = vnode.component
      // 激活时直接挂载
      move(vnode, container, anchor, MoveType.ENTER)
      // 激活时更新
      patch(
        instance.vnode,
        vnode,
        container,
        anchor,
        instance,
        parentSuspense,
        namespace
      )

      // hooks
      if (instance.a) {
        invokeArrayFns(instance.a)
      }
    }
    sharedContext.deactivate = (vnode) => {
      const instance = vnode.component
      // 移动到缓存容器
      move(vnode, storageContainer, null, MoveType.LEAVE)

      // hooks
      if (instance.da) {
        invokeArrayFns(instance.da)
      }
    }
    const unmount = (vnode: VNode) => {
      resetShapeFlag(vnode)
      _unmount(vnode, instance, parentSuspense, true)
    }

    const pruneCache = (filter?: (name: string) => boolean) => {
      cache.forEach((vnode, key) => {
        const name = getComponentName(vnode.type)
        if (name && (!filter || !filter(name))) {
          pruneCacheEntry(key)
        }
      })
    }

    const pruneCacheEntry = (key: CacheKey) => { 
      const cached = cache.get(key) as VNode
      if (cached && (!current || !isSameVNodeType(cached, current))) {
        unmount(cached)
      } else if (current) {
        resetShapeFlag(current)
      }
      cache.delete(key)
      keys.delete(key)
    }

    // 缓存的键
    let pendingCacheKey: CacheKey | null = null
    const cacheSubtree = () => {
      if (!isNil(pendingCacheKey)) {
        cache.set(pendingCacheKey, getInnerChild(instance.subTree))
      }
    }

    onMounted(cacheSubtree)
    onUpdated(cacheSubtree)

    onBeforeUnmount(() => {
      console.log('unmount')
      cache.forEach((cached) => {
        const { subTree, suspense } = instance
        const vnode = getInnerChild(subTree)
        if (cached.type === vnode.type && cached.key === vnode.key) {
          resetShapeFlag(vnode)
          const da: any = vnode.component?.da
          if (isArray(da)) {
            da.forEach((fn) => fn())
          } else {
            da?.()
          }
          return
        }
        unmount(cached)
      })
    })

    return () => {
      pendingCacheKey = null
      if (!slots.default) {
        return null
      }
      const vnode: VNode = (slots.default as Function)?.()
      const comp = vnode.type
      const name = getComponentName(comp)
      const { include, exclude, max } = props
      if (
        (include && (!name || !matches(include, name))) ||
        (exclude && name && matches(exclude, name))
      ) {
        current = vnode
        return vnode
      }

      const key = vnode.key == null ? comp : vnode.key
      const cachedVNode = cache.get(key) as VNode
      pendingCacheKey = key
      if (cachedVNode) {
        // 复用缓存组件，直接设置组件的 el 属性
        vnode.el = cachedVNode.el
        // 设置组件的 component 属性
        vnode.component = cachedVNode.component
        // 标识组件已经被缓存过了
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        // 将set中有的元素移动到末尾
        keys.delete(key)
        keys.add(key)
      } else {
        keys.add(key)
        if (max && keys.size > parseInt(max as any, 10)) {
          // lru: least recently used 最近最少使用算法，缓存中有多个元素时，淘汰最近最不常使用的元素。
          pruneCacheEntry(keys.values().next().value) //! 这里是获取set中的第一个元素
        }
      }

      // 作用是稍后组件卸载的时候，不要卸载，意味着后续可以复用这个组件的 DOM 元素
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE

      current = vnode

      return vnode
    }
  }
}

export const KeepAlive = KeepAliveImpl as unknown as { 
  __isKeepAlive: true 
  new () : {
    $props: VNodeProps & KeepAliveProps
    $slots: {
      default(): VNode[]
    }
  }
}

export const isKeepAlive = (vnode: VNode): boolean => (vnode.type as any).__isKeepAlive

function registerKeepAliveHook(hook, type: LifecycleHooks, target: ComponentInternalInstance | null = currentInstance) {
  const wrapperHook = () => {
    let current = target
    while (current) {
      current = current.parent
    }
    return hook()
  }
  injectHooks(type, wrapperHook, target)
}

export function onActivated(hook, target?: ComponentInternalInstance | null) {
  registerKeepAliveHook(hook, LifecycleHooks.ACTIVATED, target)
}

export function onDeactivated(hook, target?: ComponentInternalInstance | null) {
  registerKeepAliveHook(hook, LifecycleHooks.DEACTIVATED, target)
}