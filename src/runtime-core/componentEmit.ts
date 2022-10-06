import { capitalize, toHandlerKey } from "../shared/index"

export function emit(instance: any, event, ...args) {
  const { props } = instance

  // event: add -> onAdd
  // event: add-foo -> onAddFoo
  const handleName = toHandlerKey(capitalize(event))
  // 先首字母最大，再判断是否需要驼峰化，最后组装on+name
  const handler = props[handleName]
  // props["onAdd"]
  handler && handler(...args)
}

