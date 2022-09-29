const extend = Object.assign

function isObject(obj: Object) {
  return obj !== null && typeof obj === "object"
}

function hasChanged(oldValue: Object, newValue: Object) {
  return !Object.is(oldValue, newValue)
}
export {
  extend,
  isObject,
  hasChanged,
}