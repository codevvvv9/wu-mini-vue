const extend = Object.assign

function isObject(obj: Object) {
  return obj !== null && typeof obj === "object"
}

function hasChanged(oldValue: Object, newValue: Object) {
  return !Object.is(oldValue, newValue)
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function camelize(str: string) {
  // add-foo -> onAddFoo
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : ''
  })
}

function toHandlerKey(str: string) {
  return str ? ('on' + camelize(str)) : ''
}

export {
  extend,
  isObject,
  hasChanged,
  hasOwn,
  toHandlerKey,
  capitalize,
}