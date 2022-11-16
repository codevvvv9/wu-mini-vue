import { h, ref, getCurrentInstance, nextTick } from '../../lib/guide-mini-vue.esm.js'

export default {
  name: 'App',
  setup() {
    const count = ref(1)
    const instance = getCurrentInstance()

    function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log('update');
        count.value = i
        // 像这种同步更新，dom那更新元素只需要最后加载一次即可，不应每次更新
      }
      // 直接这样写还拿不到最新的99
      // console.log('currentInstance is: ', instance);
      // 需要使用nextTick()
      nextTick(() => {
        // 这里能拿到最新的值
        console.log('currentInstance is: ', instance);
      })
    }
    return {
      count,
      onClick,
    }
  },
  render() {
    const button = h('button', {onClick: this.onClick}, "update")
    const p = h('p', {}, 'count: ' + this.count)
    return h(
      'div',
      {},
      [button, p]
    )
  }
}