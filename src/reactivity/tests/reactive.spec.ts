import { isReactive, reactive } from "../reactive"

describe("reactive", () => {
  it("happy path", () => {
    const origin = {
      'foo': 1,
      'nest': {
        'test': 1
      },
      'arr': [{
        test: 123
      }]
    }

    const observed = reactive(origin)
    expect(observed).not.toBe(origin)
    expect(observed.foo).toBe(1)

    // 查看某个对象是不是响应式的
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(origin)).toBe(false)

    // 嵌套对象也应该是响应式
    expect(isReactive(observed.nest)).toBe(true)
    expect(isReactive(observed.arr)).toBe(true)
    expect(isReactive(observed.arr[0])).toBe(true)
  })
})