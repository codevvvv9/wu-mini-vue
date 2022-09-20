import { 
  mutableHandlers, 
  mutableHandlersReadonly,
} from "./baseHandler";
function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers)
}

// 和reactive类似，但只读，即不需要依赖收集与触发
function readonly(raw) {
  return createReactiveObject(raw, mutableHandlersReadonly)
}

/**
 * 统一创建响应式数据
 * @param target 要处理的obj
 * @param baseHandler proxy的处理器
 * @returns 经过proxy代理后的响应式数据
 */
function createReactiveObject(target :any, baseHandler) {
  const result = new Proxy(target, baseHandler)
  return result
}

export { reactive, readonly };
