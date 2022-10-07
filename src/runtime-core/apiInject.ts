import { getCurrentInstance } from "./component";

export function provide(key: any, value: any) {
  const currentInstance: any = getCurrentInstance()

  if (currentInstance) {
    let { provides } = currentInstance
    let parentProvides = currentInstance.parent.provides

    // 绑定父级原型链，只需要初始化一次即可
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }

    provides[key] = value
  }
}

export function inject(key: any, defaultValue: any) {
  const currentInstance: any = getCurrentInstance()

  if (currentInstance) {
    // 从父级上面一层一层的取值
    const parentProvides = currentInstance.parent.provides

    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      if (typeof defaultValue === 'function') {
        return defaultValue()
      } else {
        return defaultValue
      }
    }
  }
}