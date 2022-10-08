import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";
import { FragmentType, VNode, TextType } from "./vnode"

export function createRenderer(options: any) {
  // 接受自定义的三个函数
  const { 
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
   } = options

  function render(vnode: VNode, container) {
    // 第一次的顶级组件，没有父组件
    patch(vnode, container, null)
  }

  /**
   * 打补丁
   * @param vnode 
   * @param container 
   */
  function patch(vnode: VNode, container, parentComponent) {
    // 判断是不是element
    // 如何判断是element还是component
    const { shapeFlag, type } = vnode
    switch (type) {
      case FragmentType:
        processFragment(vnode, container, parentComponent)
        break;
      case TextType:
        processText(vnode, container)
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 是element，到了render内部的真正的h()
          processElement(vnode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 是component
          processComponent(vnode, container, parentComponent)
        }
        break;
    }
  }

  /**
   * 处理组件
   * @param vnode 
   * @param container 
   */
  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent)
  }

  /**
   * 加载组件
   * @param vnode 
   * @param container 
   */
  function mountComponent(initialVNode: VNode, container: any, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent)

    setupComponent(instance)
    setupRenderEffect(instance, initialVNode, container)
  }
  function setupRenderEffect(instance: any, initialVNode: VNode, container: any) {
    // 是一个vnode树
    // 绑定proxy到render函数上
    const { proxy } = instance
    const subTree = instance.render.call(proxy)

    // vnode -> element -> mountElement
    patch(subTree, container, instance)

    // 这个时候element都被加载完了，处理vnode上的el
    initialVNode.el = subTree.el
  }

  function processElement(vnode: VNode, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent)
  }

  function mountElement(vnode, container: Element, parentComponent) {
    const element: Element = (vnode.el = hostCreateElement(vnode.type))

    const { props } = vnode
    // 其实就是属性值
    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        const value = props[key];
        hostPatchProp(element, key, value)
      }
    }

    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      element.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, element, parentComponent)
    }

    hostInsert(container, element)
  }

  function mountChildren(vnode, container: Element, parentComponent) {
    vnode.children.forEach(vnode => {
      patch(vnode, container, parentComponent)
    })
  }

  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent)
  }

  function processText(vnode: VNode, container: Element) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
  }

  return {
    createApp: createAppAPI(render),
  }
}
