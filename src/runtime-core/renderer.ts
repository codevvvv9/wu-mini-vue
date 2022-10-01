import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./components"
import { VNode } from "./vnode"

export function render(vnode: VNode, container) {
  patch(vnode, container)
}

/**
 * 打补丁
 * @param vnode 
 * @param container 
 */
function patch(vnode: VNode, container) {
  // TODO 判断是不是element
  // 如何判断是element还是component
  if (typeof vnode.type === 'string') {
    // 是element，到了render内部的真正的h()
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    // 是component
    processComponent(vnode, container)
  }
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
function mountComponent(vnode: VNode, container: any) {
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

function processElement(vnode: VNode, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode, container: Element) {
  const element: Element = document.createElement(vnode.type)

  const { props } = vnode
  // 其实就是属性值
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const attr = props[key];
      element.setAttribute(key, attr)
    }
  }

  const { children } = vnode
  if (typeof children === 'string') {
    element.textContent = children
  } else if (Array.isArray(children)) {
    mountChildren(children, element)
  }

  container.append(element)
}

function mountChildren(children: Array<VNode>, container: Element) {
  children.forEach(vnode => {
    patch(vnode, container)
  })
}

