import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";
import { FragmentType, VNode, TextType } from "./vnode"
import { effect } from '../reactivity/effect'

export function createRenderer(options: any) {
  // 接受自定义的三个函数
  const { 
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
   } = options

  function render(newVNode: VNode, container) {
    // 第一次的顶级组件，没有父组件
    patch(null, newVNode, container, null)
  }

  /**
   * 打补丁
   * @param oldVNode 
   * @param newVNode 
   * @param container 
   */
  function patch(oldVNode, newVNode: VNode, container, parentComponent) {
    // 判断是不是element
    // 如何判断是element还是component
    const { shapeFlag, type } = newVNode
    switch (type) {
      case FragmentType:
        processFragment(oldVNode, newVNode, container, parentComponent)
        break;
      case TextType:
        processText(oldVNode, newVNode, container)
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 是element，到了render内部的真正的h()
          processElement(oldVNode, newVNode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 是component
          processComponent(oldVNode, newVNode, container, parentComponent)
        }
        break;
    }
  }

  /**
   * 处理组件
   * @param newVNode 
   * @param container 
   */
  function processComponent(oldVNode, newVNode: any, container: any, parentComponent) {
    mountComponent(oldVNode, newVNode, container, parentComponent)
  }

  /**
   * 加载组件
   * @param newVNode 
   * @param container 
   */
  function mountComponent(oldVNode, initialVNode: VNode, container: any, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent)

    setupComponent(instance)
    setupRenderEffect(instance, initialVNode, container)
  }
  function setupRenderEffect(instance: any, initialVNode: VNode, container: any) {
    // 值一更新 set 就会执行effect里面的函数
    // 但是要区分初始化和更新
    effect(() => {
      if (!instance.isMounted) {
        // 初始化 时先把subTree存起来
        console.log('init patch');
        
        // 是一个vnode树
        // 绑定proxy到render函数上
        const { proxy } = instance
        const subTree = (instance.subTree = instance.render.call(proxy))
    
        // newVNode -> element -> mountElement
        patch(null, subTree, container, instance)
    
        // 这个时候element都被加载完了，处理vnode上的el
        initialVNode.el = subTree.el

        instance.isMounted = true
      } else {
        // 只是更新了，不需要再patch
        console.log('update patch');
        
        // 是一个vnode树
        // 绑定proxy到render函数上
        const { proxy } = instance
        // 新树
        const subTree = instance.render.call(proxy)
        // 获取初始化时存的那个老树
        const prevSubTree = instance.subTree
        // 重新赋值，赋值新树成为下一次的老树
        instance.subTree = subTree
        // newVNode -> element -> mountElement
        patch(prevSubTree, subTree, container, instance)
      }
    })
  }

  function processElement(oldVNode, newVNode: VNode, container: any, parentComponent) {
    // 区分是初始化还是更新操作
    if (!oldVNode) {
      // 初始化
      mountElement(newVNode, container, parentComponent)
    } else {
      patchElement(oldVNode, newVNode, container)
    }
  }
  /**
   * 更新操作
   * @param oldVNode 
   * @param newVNode 
   * @param container 
   */
  function patchElement(oldVNode, newVNode, container) {
    console.log('patchElement');
    console.log('oldVNode', oldVNode);
    console.log('newVNode', newVNode);
    
  }
  function mountElement(newVNode, container: Element, parentComponent) {
    const element: Element = (newVNode.el = hostCreateElement(newVNode.type))

    const { props } = newVNode
    // 其实就是属性值
    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        const value = props[key];
        hostPatchProp(element, key, value)
      }
    }

    const { children, shapeFlag } = newVNode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      element.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(newVNode, element, parentComponent)
    }

    hostInsert(container, element)
  }

  function mountChildren(vnode, container: Element, parentComponent) {
    vnode.children.forEach(vnode => {
      patch(null, vnode, container, parentComponent)
    })
  }

  function processFragment(oldVNode, newVNode: any, container: any, parentComponent) {
    mountChildren(newVNode, container, parentComponent)
  }

  function processText(oldVNode, newVNode: VNode, container: Element) {
    const { children } = newVNode
    const textNode = (newVNode.el = document.createTextNode(children))
    container.append(textNode)
  }

  return {
    createApp: createAppAPI(render),
  }
}
