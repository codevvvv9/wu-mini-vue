import { effect } from "../effect";
import { reactive } from "../reactive";


describe("effect", () => {
  it('Happy path', () => {
    const origin = reactive({
      'age': 10
    })
    
    let nextAge
    effect(() => {
      nextAge = origin.age + 1
    })

    expect(nextAge).toBe(11)

    // update 
    // 必须先get再去set新的值
    // 直接只set的话，想要的值会是set后的值的再触发effect的函数执行完后的值。
    origin.age = origin.age + 1
    expect(nextAge).toBe(12)
  });

  it("should return runner when call effect", () => {
    // effect 执行完应该返回一个runner
    // runner执行的时候会重新执行run函数
    // 这个runner执行传进去的fn,并返回fn执行完的值
    let foo = 1

    const runner = effect(() => {
      foo++
      return foo
    })
    expect(foo).toBe(2)
    runner()
    expect(foo).toBe(3)
    expect(runner()).toBe(4)
  })
})