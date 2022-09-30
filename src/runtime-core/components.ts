import { vnode } from "./vnode";

export function createComponentInstance(vnode: vnode) {
  const component = {
    vnode,
    type: vnode.type,
  }
  
  return component
}

export function setupComponent(instance: any) {
  // TODO
  // initProps
  // initSlots
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  // 获取用户的配置
  const Component = instance.type

  const { setup } = Component
  if (setup) {
    const setupResult = setup()

    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // setupResult有可能是function 或者 Object
  // TODO function 就认为他是render函数
  if (typeof setupResult === 'object') {
    // 更新实例的setupState属性
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type

  if (Component.render) {
    instance.render = Component.render
  }
}

