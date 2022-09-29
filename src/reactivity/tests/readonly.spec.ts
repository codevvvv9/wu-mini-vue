import { isReadonly, readonly } from "../reactive";

describe("readonly", () => {
  it('happy path', () => {
    const origin = {
      foo: 1
    }

    const observed = readonly(origin)
    expect(observed.foo).toBe(1)
    expect(observed).not.toBe(origin)
  });
  it('console warn when you set value', () => {
    const origin = {
      foo: 1
    }
    console.warn = jest.fn()
    const observed = readonly(origin)
    observed.foo = 2
    expect(console.warn).toHaveBeenCalled()
    expect(isReadonly(observed)).toBe(true)
    expect(isReadonly(origin)).toBe(false)
  });
})