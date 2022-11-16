let queue: any[] = []
// 为了防止多次创建Promise，使用标志位
let isFlushPending = false

export function nextTick(fn) {
  // 就是为了返回一个新的微任务
  return fn ? Promise.resolve().then(fn) : Promise.resolve()
}

export function queueJobs(job: Function) {
  // 如果在当前队列中，不处理，只有不在 才处理
  if (!queue.includes(job)) {
    queue.push(job)
  }


  queueFlush()
}

// 通过这个操作，就把之前的同步操作，变成了异步操作
function queueFlush() {
  if (isFlushPending) return
  isFlushPending = true
  // 构造微任务执行 job，多个job需要循环
  // Promise.resolve().then(() => {
  //   isFlushPending = false
  //   let job
  //   while (job = queue.pop()) {
  //     job && job()
  //   }
  // })
  // 将上面的代码使用nextTick重构
  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false
  let job
  while (job = queue.pop()) {
    job && job()
  }
}