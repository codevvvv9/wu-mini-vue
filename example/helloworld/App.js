import { h } from '../../lib/guide-mini-vue.esm.js'

export const App = {
  // .vue组件的<template></template>转换
  // 以运行时展现app组件
  // render函数必须传入
  render() {
    return h('div', 'hi' + this.msg)
  },
  setup() {
    // composition api
    
    return {
      msg: 'mini-vue',
    }
  }
}