import { createVNode } from "./vnode"
import { render } from "./renderer"

function createApp(rootComponent: any) {
  return {
    mount(el) {
      // 先vnode
      // 把 component -> vnode
      // 所有逻辑都基于vnode处理
      const vnode = createVNode(rootComponent)
      let rootContainer = el
      if (typeof el === "string") {
        rootContainer = getContainer(el)
      }
      render(vnode, rootContainer)
    }
  }
}

function getContainer(el: string): Element | null {
  return document.querySelector(el)
}

export {
  createApp
}