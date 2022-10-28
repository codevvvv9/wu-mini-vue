import { VNode } from "./vnode";

function shouldUpdateComponent(oldVNode: VNode, newVNode: VNode) {
  const { props: preProps } = oldVNode
  const { props: nextProps } = newVNode

  for (const prop in nextProps) {
    if (nextProps[prop] !== preProps[prop]) {
      return true
    }
  }

  return false
}

export {
  shouldUpdateComponent,
}