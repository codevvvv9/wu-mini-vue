import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  setup() {
    return {}
  },
  render() {
    const foo = h('p', {}, 'foo')

    // 插槽就是Foo组件获取到当前vnode里面的children
    // Foo .vnode -> children -> 获取到this.$slots
    // console.log('this.$slots is', this.$slots);
    const age = 18
    return h('div', {}, [
      renderSlots(this.$slots, 'header', {
        age
      }), 
      foo, 
      renderSlots(this.$slots, 'footer')])
  },
}