export interface SchedulerJob extends Function {
  id?: number
  pre?: boolean
  active?: boolean
  computed?: boolean
  allowRecurse?: boolean
  i: any
}
// 工作队列
const queue: SchedulerJob[] = []
// 是否正在刷新队列
let isFlushing = false
// 成功的Promise
const resolvePromise = Promise.resolve()
export function queueJob(job: SchedulerJob) {
  // 队列中没有job或者job不存在于队列中, 添加job
  if (
    !queue.length ||
    !queue.includes(job)
  ) {
    queue.push(job)
  }
  // 刷新队列
  queueFlush()
}

function queueFlush() {
  // 如果没有正在刷新队列
  if (!isFlushing) {
    // 设置正在刷新队列为true
    isFlushing = true
    // 创建微任务，作用是等当前数据更新完毕后，再刷新队列
    resolvePromise.then(flushJobs)
  }
}

function flushJobs() {
  // 设置正在刷新队列为false
  isFlushing = false
  let job
  // 循环队列，执行队列中的job
  while (job = queue.shift()) {
    job()
  }
}