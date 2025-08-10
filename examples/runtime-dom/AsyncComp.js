import { h, render } from '../../node_modules/vue/dist/vue.esm-browser.js'

export default {
  name: 'AsyncComp',
  setup() {
    return {
      msg: 'Async Component',
    }
  },
  render() {
    return h('div', this.msg)
  }
}
