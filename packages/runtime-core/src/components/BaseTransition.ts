import { getCurrentInstance, SetupContext } from "../component"
import { type RendererElement } from "../renderer"
import { VNode } from "../vnode"

type Hooks<T = () => void> = T | T[]

export interface BaseTransitionProps<HostElement = RendererElement> {
  mode?: 'in-out' | 'out-in' | 'default' | undefined
  appear?: boolean
  persisted?: boolean
  // enter
  onBeforeEnter?: Hooks<(el: HostElement) => void>
  onEnter?: Hooks<(el: HostElement, done: () => void) => void>
  onAfterEnter?: Hooks<(el: HostElement) => void>
  onEnterCancelled?: Hooks<(el: HostElement) => void>
  // leave
  onBeforeLeave?: Hooks<(el: HostElement) => void>
  onLeave?: Hooks<(el: HostElement, done: () => void) => void>
  onAfterLeave?: Hooks<(el: HostElement) => void>
  onLeaveCancelled?: Hooks<(el: HostElement) => void>
  // appear
  onBeforeAppear?: Hooks<(el: HostElement) => void>
  onAppear?: Hooks<(el: HostElement, done: () => void) => void>
  onAfterAppear?: Hooks<(el: HostElement) => void>
  onAppearCancelled?: Hooks<(el: HostElement) => void>
}

export const BaseTransitionPropsValidators = {
  mode: String,
  appear: Boolean,
  persisted: Boolean,
  // enter
  onBeforeEnter: Function,
  onEnter: Function,
  onAfterEnter: Function,
  onEnterCancelled: Function,
  // leave
  onBeforeLeave: Function,
  onLeave: Function,
  onAfterLeave: Function,
  onLeaveCancelled: Function,
  // appear
  onBeforeAppear: Function,
  onAppear: Function,
  onAfterAppear: Function,
  onAppearCancelled: Function,
}

const BaseTransitionImpl: any = {
  name: 'BaseTransition',
  props: BaseTransitionPropsValidators,
  setup(props: BaseTransitionProps, { slots }: SetupContext) {
    const instance = getCurrentInstance()
    return () => {
      const child: VNode = (slots.default as any)?.()
      if (!child) {
        return
      }
      // 渲染前（进入）和 渲染后（离开）
      // console.log(props)
      const {
        onBeforeEnter: beforeEnter,
        onEnter: enter,
        onAfterEnter: afterEnter,
        onEnterCancelled: enterCancelled,
        onBeforeLeave: beforeLeave,
        onLeave: leave,
        onAfterLeave: afterLeave,
        onLeaveCancelled: leaveCancelled,
        onBeforeAppear: beforeAppear,
        onAppear: appear,
        onAfterAppear: afterAppear,
        onAppearCancelled: appearCancelled,
      } = props
      child.transition = {
        beforeEnter,
        enter,
        afterEnter,
        enterCancelled,
        beforeLeave,
        leave,
        afterLeave,
        leaveCancelled,
        beforeAppear,
        appear,
        afterAppear,
        appearCancelled,
      }
      return child
    }
  }
}

export const BaseTransition = BaseTransitionImpl as unknown as {
  new (): {
    $props: BaseTransitionProps<any>
    $slots: {
      default: () => VNode[]
    }
  }
}