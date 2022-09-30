type vnode = {
  type,
  props,
  children,
}

function createVNode(type: any, props?, children?) {
  const vnode = {
    type,
    props,
    children,
  }

  return vnode
}

export {
  createVNode,
  vnode
}