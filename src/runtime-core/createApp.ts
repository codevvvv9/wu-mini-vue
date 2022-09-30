import { createVNode } from "./vnode"
import { render } from "./renderer"

function createApp(rootComponent: any) {
  return {
    mount(rootContainer) {
      // 先vnode
      // 把 component -> vnode
      // 所有逻辑都基于vnode处理
      const vnode = createVNode(rootComponent)

      render(vnode, rootContainer)
    }
  }
}

export {
  createApp
}