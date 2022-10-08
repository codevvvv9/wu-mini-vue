import { createRenderer } from "../runtime-core/renderer"

function createElement(type: any) {
  return document.createElement(type)
}

function patchProp(el: any, key: any, value: any) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase()
    el.addEventListener(eventName, value)
  } else {
    el.setAttribute(key, value)
  }
}

function insert(container: any, element: any) {
  container.append(element)
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core/index'