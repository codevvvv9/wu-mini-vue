import { ReactiveEffect } from "./effect"

class ComputedImpl {
  private _getter: () => any
  private _dirty: Boolean = true
  private _value: any
  private _effect: ReactiveEffect
  constructor(getter: () => any) {
    this._getter = getter
    this._effect = new ReactiveEffect(getter, () => {
      // 使用scheduler的副作用 切换_dirty值，保证执行一次
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }

  
  public get value() : any {
    // 再次get时 value -> dirty 变为true
    // 当依赖的那个响应式对象的值发生改变时
    // effect
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    // 如果再次get，把之前的值给你
    return this._value
  }
  
}
function computed(getter: () => any) {
  return new ComputedImpl(getter)
}

export {
  computed
}