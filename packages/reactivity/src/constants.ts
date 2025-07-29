export enum TrackOpTypes {
  GET = 'get',
  HAS = 'has',
  ITERATE = 'iterate'
}

export enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear'
}

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const DirtyLevels = {
  NotDirty: 0, // 不脏，用上一次返回的值
  QueryingDirty: 1, // 脏，正在查询中
  MaybeDirty_ComputedSideEffect: 2, // 脏，但是可能在计算属性的副作用中
  MaybeDirty: 3, // 脏，但是不在计算属性的副作用中
  Dirty: 4, // 脏，需要重新计算
}