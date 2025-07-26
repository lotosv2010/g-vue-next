import { isFunction, isObject } from '@g-vue-next/shared'

export const reactive = () => {
  console.log(isFunction(() => {}))
  console.log(isObject({}))
}