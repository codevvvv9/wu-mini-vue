// 这就是所谓的依赖
class ReactiveEffect {
  private _fn: any
  public scheduler: Function | undefined
  constructor(fn, scheduler) {
    this._fn = fn
    this.scheduler = scheduler
  }
  run() {
    activeEffect = this
    return this._fn()
  }
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
  // 第三个set存储dep
  deps.add(activeEffect)
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
}
function effect(fn: Function, options: effectOptions = {}) {
  //需要一个reactiveEffect类 做抽象
  const _effect = new ReactiveEffect(fn, options.scheduler)
  _effect.run()
  //注意run函数的this指向
  const runner = _effect.run.bind(_effect)
  return runner
}

export {
  effect,
  track,
  trigger
}