import { isObject } from "../shared"
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, readonly } from "./reactive"

//加载文件时初始化一次即可，使用缓存
const get = createGetter()
const getReadonly = createGetter(true)
const set = createSetter()

/**
 * 创建proxy需要的的get函数
 * @param isReadonly 是否只读
 * @returns get key得到的值
 */
function createGetter(isReadonly: Boolean = false) {
  return function get(target, key) {
    // target {foo: 1}
    // key foo
    //判断是不是isReactive和isReadonly类型
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    const value = Reflect.get(target, key)
    // value如果是对象还要继续递归的响应式
    if (isObject(value)) {
      return isReadonly ? readonly(value) : reactive(value)
    }
    if (!isReadonly) {
      // 依赖收集
      track(target, key)
    }
    return value
  }
}

/**
 * 创建proxy需要的的set函数
 * @returns set之后的值
 */
function createSetter() {
  return function set(target, key, value) {
    const result = Reflect.set(target, key, value)

    // 触发依赖
    trigger(target, key)
    return result
  }
}


const mutableHandlers = {
  get,
  set,
}

const mutableHandlersReadonly = {
  get: getReadonly,
  set(target, key, value) {
    //当update时提示
    console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);

    return true
  },
}
export {
  mutableHandlers,
  mutableHandlersReadonly
}