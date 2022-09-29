import { isReadonly, readonly } from "../reactive";

describe("readonly", () => {
  it('happy path', () => {
    const origin = {
      foo: 1,
      nested: {
        test: 12,
      },
       arr: [{
        test2: 12,
       }]
    }

    const observed = readonly(origin)
    expect(observed.foo).toBe(1)
    expect(observed).not.toBe(origin)

    expect(isReadonly(observed)).toBe(true)
    expect(isReadonly(origin)).toBe(false)

    // 嵌套对象也应该是响应式
    expect(isReadonly(observed.nested)).toBe(true)
    expect(isReadonly(observed.arr)).toBe(true)
    expect(isReadonly(observed.arr[0])).toBe(true)
  });
  it('console warn when you set value', () => {
    const origin = {
      foo: 1
    }
    console.warn = jest.fn()
    const observed = readonly(origin)
    observed.foo = 2
    expect(console.warn).toHaveBeenCalled()
  });
})