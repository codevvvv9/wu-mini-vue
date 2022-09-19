import { track, trigger } from "./effect"

function reactive(raw) {
  let data = new Proxy(raw, {
    get(target, key) {
      // target {foo: 1}
      // key foo
      const value = Reflect.get(target, key)

      // TODO 依赖收集
      track(target, key)
      return value
    },
    set(target, key, value) {
      const result = Reflect.set(target, key, value)

      // TODO 触发依赖
      trigger(target, key)
      return result
    }
  })

  return data
}

export {
  reactive
}