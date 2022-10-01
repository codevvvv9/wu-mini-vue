import { h } from '../../lib/guide-mini-vue.esm.js'

export const App = {
  // .vue组件的<template></template>转换
  // 以运行时展现app组件
  // render函数必须传入
  render() {
    return h(
      'div', 
      {
        id: 'root',
        class: ["red", "hard"]
      },
      // children可以是简单的string
      // "hi, mini-vue",
      // 也可以是复杂的数组
      [h("p", { class:"red"}, "hi"), h("p", {class:"blue"}, "mini-vue")]
    )
  },
  setup() {
    // composition api
    
    return {
      msg: 'mini-vue',
    }
  }
}