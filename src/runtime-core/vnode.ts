import { ShapeFlags } from "../shared/ShapeFlags"

type VNode = {
  type,
  props,
  children,
  component,
  el,
  key,
  shapeFlag,
}

const FragmentType = Symbol("Fragment")
const TextType = Symbol("Text")


/**
 * 把component转换成vnode对象
 * @param type 传入的那个组件对象 App
 * @param props 
 * @param children 字符串或者数组，数组的话，每个元素都是vnode类型
 * @returns VNode
 */
function createVNode(type: any, props?, children?): VNode {
  const vnode = {
    type,
    props,
    children,
    component: null, // 更新组件用
    el: null,
    shapeFlag: getShapeFLag(type),
    key: props && props.key, // 为diff算法用
  }

  // 根据shapeFlag判断一下children类型
  if (typeof children === 'string') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
  }

  // component + children是object才需要处理slots
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
    }
  }
  return vnode
}

function getShapeFLag(type: any) {
  return typeof type === 'string' 
    ? ShapeFlags.ELEMENT 
    : ShapeFlags.STATEFUL_COMPONENT
}

function createTextVNode(text: string) {
  return createVNode(TextType, {}, text)
}
export {
  createVNode,
  VNode,
  FragmentType,
  TextType,
  createTextVNode,
}