const extend = Object.assign

function isObject(obj: Object) {
  return obj !== null && typeof obj === "object"
}

export {
  extend,
  isObject,
}