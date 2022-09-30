export const App = {
  // .vue组件的<template></template>转换
  // 以运行时展现app组件
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