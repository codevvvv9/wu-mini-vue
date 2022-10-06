import { ShapeFlags } from "../shared/ShapeFlags"

type VNode = {
  type,
  props,
  children,
  el,
  shapeFlag,
}

/**
 * 把component转换成vnode对象
 * @param type 传入的那个组件对象 App
 * @param props 
 * @param children 
 * @returns VNode
 */
function createVNode(type: any, props?, children?): VNode {
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlag: getShapeFLag(type)
  }

  // 根据shapeFlag判断一下children类型
  if (typeof children === 'string') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}

function getShapeFLag(type: any) {
  return typeof type === 'string' 
    ? ShapeFlags.ELEMENT 
    : ShapeFlags.STATEFUL_COMPONENT
}
export {
  createVNode,
  VNode,
}