import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { FragmentType, VNode, TextType } from "./vnode"

export function render(vnode: VNode, container) {
  patch(vnode, container)
}

/**
 * 打补丁
 * @param vnode 
 * @param container 
 */
function patch(vnode: VNode, container) {
  // 判断是不是element
  // 如何判断是element还是component
  const { shapeFlag, type } = vnode
  switch (type) {
    case FragmentType:
      processFragment(vnode, container)
      break;
    case TextType:
      processText(vnode, container)
      break;
  
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 是element，到了render内部的真正的h()
        processElement(vnode, container)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 是component
        processComponent(vnode, container)
      }
      break;
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
      const isOn = (key: string) => /^on[A-Z]/.test(key)
      const value = props[key];
      if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase()
        element.addEventListener(eventName, value)
      } else {
        element.setAttribute(key, value)
      }
    }
  }

  const { children, shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    element.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, element)
  }

  container.append(element)
}

function mountChildren(vnode, container: Element) {
  vnode.children.forEach(vnode => {
    patch(vnode, container)
  })
}

function processFragment(vnode: any, container: any) {
  mountChildren(vnode, container)
}

function processText(vnode: VNode, container: Element) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
}

