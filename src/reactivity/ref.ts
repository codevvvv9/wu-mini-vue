import { hasChanged, isObject } from "../shared";
import { isTracking, ReactiveEffect, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  private _rawValue: any;
  public __v_isRef = true
  dep: Set<ReactiveEffect>;
  
  constructor(value) {
    this._value = convert(value)
    this._rawValue = value
    this.dep = new Set()
  }

  
  public get value() : any {
    trackRefValue(this)
    return this._value
  }

  
  public set value(newValue : any) {
    if ( hasChanged(this._rawValue, newValue) ) {
      //更新原始值 和 转化后的值
      this._rawValue = newValue
      this._value = convert(newValue)
      triggerEffects(this.dep)
    }
  }
  
  
}

function trackRefValue(ref: RefImpl) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}
// 转换对象，是否使用reactive()包裹
function convert(val: Object) {
  return isObject(val) ? reactive(val) : val
}
function ref(val:any) {
  return new RefImpl(val)
}

function isRef(ref: any) {
  // !!必现undefined的影响
  return !!ref.__v_isRef
}
function unRef(ref: any) {
  return isRef(ref) ? ref.value : ref
}

// 代理refs就是template里面不需要.value的原因
function proxyRefs(objWithRefs: any) {
  return new Proxy(objWithRefs, {
    get(target, value) {
      return unRef(Reflect.get(target, value))
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        //原来的值是ref对象，设置的值不是ref
        return target[key].value = value
      } else {
        return Reflect.set(target, key ,value)
      }
    }
  })
}
export {
  ref,
  isRef,
  unRef,
  proxyRefs,
}