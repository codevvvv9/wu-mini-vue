import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component"
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
function mountComponent(initialVNode: VNode, container: any) {
  const instance = createComponentInstance(initialVNode)

  setupComponent(instance)
  setupRenderEffect(instance, initialVNode, container)
}
function setupRenderEffect(instance: any, initialVNode: VNode, container: any) {
  // 是一个vnode树
  // 绑定proxy到render函数上
  const { proxy } = instance
  const subTree = instance.render.call(proxy)

  // vnode -> element -> mountElement
  patch(subTree, container)

  // 这个时候element都被加载完了，处理vnode上的el
  initialVNode.el = subTree.el
}

function processElement(vnode: VNode, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode, container: Element) {
  const element: Element = (vnode.el = document.createElement(vnode.type))

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

