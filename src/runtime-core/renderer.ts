import { createComponentInstance, setupComponent } from "./components"
import { vnode } from "./vnode"

export function render(vnode: any, container) {
  patch(vnode, container)
}

/**
 * 打补丁
 * @param vnode 
 * @param container 
 */
function patch(vnode, container) {
  // 判断是不是element
  processComponent(vnode, container)
}

/**
 * 处理组件
 * @param vnode 
 * @param container 
 */
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

/**
 * 加载组件
 * @param vnode 
 * @param container 
 */
function mountComponent(vnode: vnode, container: any) {
  const instance = createComponentInstance(vnode)

  setupComponent(instance)
  setupRenderEffect(instance, container)
}
function setupRenderEffect(instance: any, container: any) {
  // 是一个vnode树
  const subTree = instance.render()

  // vnode -> element -> mountElement
  patch(subTree, container)
  
}

