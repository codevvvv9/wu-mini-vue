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
})