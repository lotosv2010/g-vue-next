import { BaseTransitionProps, FunctionalComponent, h, BaseTransition } from "@g-vue-next/runtime-core";
import { extend } from "@g-vue-next/shared";

const TRANSITION = 'transition'
const ANIMATION = 'animation'

type AnimationType = typeof TRANSITION | typeof ANIMATION

export interface TransitionProps extends BaseTransitionProps<Element> {
  name?: string
  type?: AnimationType
  css?: boolean
  duration?: number | { enter: number, leave: number }
  // custom transition classes
  enterFromClass?: string
  enterActiveClass?: string
  enterToClass?: string
  appearFromClass?: string
  appearActiveClass?: string
  appearToClass?: string
  leaveFromClass?: string
  leaveActiveClass?: string
  leaveToClass?: string
}

const DOMTransitionPropsValidators = {
  name: String,
  type: String,
  css: {
    type: Boolean,
    default: true
  },
  duration: [String, Number, Object],
  enterFromClass: String,
  enterActiveClass: String,
  enterToClass: String,
  appearFromClass: String,
  appearActiveClass: String,
  appearToClass: String,
  leaveFromClass: String,
  leaveActiveClass: String,
  leaveToClass: String,
}

const callHook = (hook: any, args: any) => {
  if (hook) {
    if (Array.isArray(hook)) {
      hook.forEach((h) => h(...args))
    } else if (hook) {
      hook(...args)
    }
  }
}

function nextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb)
  })
}

export function addTransitionClass(el: Element, cls: string) {
  cls.split(/\s+/).forEach(c => c && el.classList.add(c));
}

export function removeTransitionClass(el: Element, cls: string) {
  cls.split(/\s+/).forEach(c => c && el.classList.remove(c));
}

export function forceReflow() {
  return document.body.offsetHeight
}

export function resolveTransitionProps(rawProps: TransitionProps) {
  const baseProps: BaseTransitionProps<Element> = {}

  for (const key in rawProps) {
    if (!(key in DOMTransitionPropsValidators)) {
      baseProps[key] = rawProps[key]
    }
  }

  if (rawProps.css === false) {
    return baseProps
  }

  const {
    name = 'v',
    type,
    duration,
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    appearFromClass = enterFromClass,
    appearActiveClass = enterActiveClass,
    appearToClass = enterToClass,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
  } = rawProps

  const {
    onBeforeEnter,
    onEnter,
    onEnterCancelled,
    onBeforeLeave,
    onLeave,
    onLeaveCancelled,
    onBeforeAppear = onBeforeEnter,
    onAppear = onEnter,
    onAppearCancelled = onEnterCancelled,
  } = baseProps
  
  const props = extend(baseProps, {
    onBeforeEnter(el) {
      callHook(onBeforeEnter, [el])
      addTransitionClass(el, enterFromClass)
      addTransitionClass(el, enterActiveClass)
    },
    onBeforeAppear(el) {
      callHook(onBeforeAppear, [el])
      addTransitionClass(el, appearFromClass)
      addTransitionClass(el, appearActiveClass)
    },
    onBeforeLeave(el) {
      callHook(onBeforeLeave, [el])
      addTransitionClass(el, leaveFromClass)
      addTransitionClass(el, leaveActiveClass)
    },
    onEnter(el, done) {
      const resolve = () => {
        removeTransitionClass(el, enterToClass)
        removeTransitionClass(el, enterActiveClass)
        done?.()
      }
      callHook(onEnter, [el, resolve])
      nextFrame(() => {
        removeTransitionClass(el, enterFromClass)
        addTransitionClass(el, enterToClass)
        
        if (!onEnter || onEnter.length <= 1) {
          el.addEventListener('transitionend', resolve)
        }
      })
    },
    onAppear(el, done) {
      const resolve = () => {
        removeTransitionClass(el, appearToClass)
        removeTransitionClass(el, appearActiveClass)
        done?.()
      }
      callHook(onAppear, [el, resolve])
      nextFrame(() => {
        removeTransitionClass(el, appearFromClass)
        addTransitionClass(el, appearToClass)
        if (!onAppear || onAppear.length <= 1) {
          el.addEventListener('transitionend', resolve)
        }
      })
    },
    onLeave(el, done) {
      const resolve = () => {
        removeTransitionClass(el, leaveFromClass)
        removeTransitionClass(el, leaveToClass)
        removeTransitionClass(el, leaveActiveClass)
        done?.()
      }
      addTransitionClass(el, leaveFromClass)
      forceReflow() // 强制重排，确保动画开始
      addTransitionClass(el, leaveActiveClass)
      callHook(onLeave, [el, resolve])
      nextFrame(() => {
        removeTransitionClass(el, leaveFromClass)
        addTransitionClass(el, leaveToClass)
        if (!onLeave || onLeave.length <= 1) {
          el.addEventListener('transitionend', resolve)
        }
      })
      
    },
    onEnterCancelled(el) {
      removeTransitionClass(el, enterToClass)
      removeTransitionClass(el, enterActiveClass)
      callHook(onEnterCancelled, [el])
    },
    onAppearCancelled(el) {
      removeTransitionClass(el, appearToClass)
      removeTransitionClass(el, appearActiveClass)
      callHook(onAppearCancelled, [el])
    },
    onLeaveCancelled(el) {
      removeTransitionClass(el, leaveFromClass)
      removeTransitionClass(el, leaveToClass)
      removeTransitionClass(el, leaveActiveClass)
      callHook(onLeaveCancelled, [el])
    }
  }) as any
  return props
}

// 函数式组件的功能比较少，为了方便函数式组件处理了属性
// 处理属性后传递给 状态组件 setup
export const Transition: FunctionalComponent<TransitionProps> = (
  props,
  { slots }
) => h(BaseTransition, resolveTransitionProps(props), slots as any)