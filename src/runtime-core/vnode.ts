type VNode = {
  type,
  props,
  children,
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
  }

  return vnode
}

export {
  createVNode,
  VNode,
}