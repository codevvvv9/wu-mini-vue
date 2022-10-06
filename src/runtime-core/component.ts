import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { publicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
import { VNode } from "./vnode";

export function createComponentInstance(vnode: VNode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: () => {}
  }
  
  // 初始化emit
  component.emit = emit.bind(null, component) as any
  return component
}

/**
 * 给instance绑定render和setupState 也就是setupResult
 * @param instance 组件实例
 */
export function setupComponent(instance: any) {
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  // 获取用户的配置
  const Component = instance.type
  
  // 给实例设置代理, 使用_ 变量传递instance
  instance.proxy = new Proxy(
    {_: instance},
    publicInstanceProxyHandlers
  )
  const { setup } = Component
  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })

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

