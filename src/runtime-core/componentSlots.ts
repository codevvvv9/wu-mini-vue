import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance: any, children) {
  // 为了支持单vnode和数组形式，统一使用数组包裹
  // instance.slots = Array.isArray(children) ? children : [children]
  // 又为了支持具名插槽，改用map结构
  // normalizeSlots(children, instance.slots);
  //判断一下是否要格式化
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeSlots(children, instance.slots);
  }
}

/**
 * 初始化instance的slots对象
 * @param children 
 * @param slots 未赋值的slots {}
 */
function normalizeSlots(children: any, slots: any) {
  
  for (const key in children) {
    if (Object.prototype.hasOwnProperty.call(children, key)) {
      const value = children[key];
      // 统一处理成函数
      slots[key] = (props) => normalizeSlotValue(value(props));
    }
  }

}


function normalizeSlotValue(value: any) {
  return Array.isArray(value)? value : [ value ]
}