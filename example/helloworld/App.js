import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self = null
export const App = {
  name: 'App',
  // .vue组件的<template></template>转换
  // 以运行时展现app组件
  // render函数必须传入
  render() {
    window.self = this
    return h(
      'div', 
      // props
      {
        id: 'root',
        class: ["red", "hard"],
        onClick() {
          console.log('root is click');
        },
        onMousedown() {
          console.log('root is mousedown');
        }
      },
      // children可以是简单的string
      // "hi " + this.msg,
      // 也可以是复杂的数组
      // [h("p", { class:"red"}, "hi"), h("p", {class:"blue"}, "mini-vue")]
      [
        h('div', {}, 'hi' + this.msg), 
        h(Foo, {
          count: 1,
        })
      ]
    )
  },
  // 返回值就是instance.setupState
  setup() {
    // composition api
    
    return {
      msg: 'mini-vue222',
    }
  }
}