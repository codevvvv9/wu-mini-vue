import {
  mutableHandlers,
  mutableHandlersReadonly,
  mutableHandlersShallowReactive,
  mutableHandlersShallowReadonly,
} from "./baseHandler";

enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
}
function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers)
}

function shallowReactive(raw) {
  return createReactiveObject(raw, mutableHandlersShallowReactive)
}

// 和reactive类似，但只读，即不需要依赖收集与触发
function readonly(raw) {
  return createReactiveObject(raw, mutableHandlersReadonly)
}

function shallowReadonly(raw) {
  return createReactiveObject(raw, mutableHandlersShallowReadonly)
}
/**
 * 统一创建响应式数据
 * @param target 要处理的obj
 * @param baseHandler proxy的处理器
 * @returns 经过proxy代理后的响应式数据
 */
function createReactiveObject(target: any, baseHandler) {
  const result = new Proxy(target, baseHandler)
  return result
}


function isReactive(val:Object) {
  // 双感叹号 去除undefined的影响
  return !!val[ReactiveFlags.IS_REACTIVE]
}

function isReadonly(val:Object) {
  return !!val[ReactiveFlags.IS_READONLY]
}
export {
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  isReactive,
  isReadonly,
  ReactiveFlags,
};
