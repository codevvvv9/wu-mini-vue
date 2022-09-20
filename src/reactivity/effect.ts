import { extend } from '../shared/index.js'
// 这就是所谓的依赖
class ReactiveEffect {
  private _fn: any
  public scheduler: Function | undefined
  // public onStop: Function | undefined
  onStop?: () => void
  deps = []
  isActive = true
  constructor(fn, scheduler) {
    this._fn = fn
    this.scheduler = scheduler
  }
  run() {
    activeEffect = this
    return this._fn()
  }
  stop() {
    if (this.isActive) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.isActive = false
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect)
  })
}
/**
 * 需要全局容器来存储依赖关系，需要两个map存储
 * 并且deps不能重复，使用Set数据结构
 * target -> key -> deps
 * map       map    set
 */
let targetMap = new Map()
function track(target, key) {
  // 第一个map 储存target
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    //不存在则初始化depsMap，并添加
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  //第二个map ，存储key
  let deps = targetMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  // 处理异常情况
  if (!activeEffect) return
  // 第三个set存储dep
  deps.add(activeEffect)
  // 反向收集依赖
  activeEffect.deps.push(deps)
}
function trigger(target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    throw new Error(`没有找到${target}的依赖`);
  }
  let deps = depsMap.get(key)
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}
// 全局的对象来收集依赖
let activeEffect

type effectOptions = {
  scheduler?: Function
  onStop?: Function
}
function effect(fn: Function, options: effectOptions = {}) {
  //需要一个reactiveEffect类 做抽象
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // 挂载其它属性到effect实例上，例如onStop
  extend(_effect, options)

  _effect.run()
  //注意run函数的this指向
  const runner: any = _effect.run.bind(_effect)
  // 给runner挂载effect
  runner.effect = _effect
  return runner
}

function stop(runner:any) {
  runner.effect.stop()
}
export {
  effect,
  track,
  trigger,
  stop,
}