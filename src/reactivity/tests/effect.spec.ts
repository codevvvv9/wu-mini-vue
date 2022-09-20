import { effect, stop } from "../effect";
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

  it('could have a scheduler when call effect', () => {
    // 1. effect可以接受一个options
    // 2. options中有一个函数scheduler
    // 3. 第一次effect默认执行run函数，但是scheduler不执行
    // 4. 响应式数据 update后 不会执行run函数了，只会触发 scheduler 一次
    // 4. 手动run之后，数据才会真正更新
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({
      'foo': 1
    })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // 响应式数据更新后，scheduler才调用1次
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    // 数值没有更新
    expect(dummy).toBe(1)
    // 手动run后数据才更新
    run()
    expect(dummy).toBe(2)
  });

  it('should have a stop function when call effect', () => {
    let dummy
    const obj = reactive({
      'foo': 1
    })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
    )
    obj.foo = 2
    expect(dummy).toBe(2)
    // stop是可以阻止更新runner执行的，即清理掉effect
    stop(runner)
    obj.foo = 3;
    expect(dummy).toBe(2);
    runner()
    expect(dummy).toBe(3)
  });
  it('should have a onstop function when call effect', () => {
    let dummy
    const obj = reactive({
      'foo': 1
    })
    const onStop = jest.fn()
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { onStop }
    )
    // stop触发时，可以接受onStop的回调
    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  });
})