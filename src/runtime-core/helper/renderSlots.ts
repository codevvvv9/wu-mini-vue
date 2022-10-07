import { createVNode, FragmentType } from "../vnode";

/**
 * 渲染插槽内容
 * @param slots 插槽内容
 * @param name 插槽名字，确定渲染slots中的哪个slot
 * @param props 作用域内容，确定渲染slots中的哪个slot
 * @returns 
 */
export function renderSlots(slots, name: string, props: object) {
  const slot = slots[name]
  if (slot) {
    //function
    if (typeof slot === 'function') {
      return createVNode(FragmentType, {}, slot(props))
    }
  } else {
    throw new Error(`name${name} 不是合法名字`)
  }
}