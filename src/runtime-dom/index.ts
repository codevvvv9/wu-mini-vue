import { createRenderer } from "../runtime-core/renderer"

function createElement(type: any) {
  return document.createElement(type)
}

function patchProp(el: Element, key: any, preValue, nextValue: any) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase()
    el.addEventListener(eventName, nextValue)
  } else {
    if (nextValue === undefined || nextValue === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextValue)
    }
  }
}

function insert(container: Node, child: any, anchor) {
  // container.append(element)
  // anchor是null就和上面一样了
  container.insertBefore(child, anchor || null)
}

function remove(el: Element) {
  const parent = el.parentNode
  if (parent) {
    parent.removeChild(el)
  }
}

function setElementText(container: Element, text: string) {
  container.textContent = text
}
const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core/index'