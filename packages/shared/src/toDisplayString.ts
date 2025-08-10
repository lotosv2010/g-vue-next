import { isArray, isFunction, isMap, isObject, isPlainObject, isSet, isString, isSymbol, objectToString } from "./general"

const isRef = (val: any): val is { value: unknown } => {
  return !!(val && val.__v_isRef === true)
}

// 转为字符串
export const toDisplayString = (val: unknown): string => {
  return isString(val)
    ? val
    : val === null
      ? ''
      : isArray(val) ||
        (isObject(val &&
          (val as any).toString === objectToString || !isFunction(val.toString)))
        ? isRef(val)
          ? toDisplayString(val.value)
          : JSON.stringify(val, replacer, 2)
        : val.toString()
}

const replacer = (_key: string, val: unknown): any => {
  if (isRef(val)) {
    return replacer(_key, val.value)
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce(
        (entries, [key, val], i) => {
          entries[stringifySymbol(key, i) + ' =>'] = val
          return entries
        },
        {} as Record<string, any>,
      ),
    }
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()].map(v => stringifySymbol(v)),
    }
  } else if (isSymbol(val)) {
    return stringifySymbol(val)
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    // native elements
    return String(val)
  }
  return val
}

const stringifySymbol = (v: unknown, i: number | string = ''): any =>
  isSymbol(v) ? `Symbol(${(v as any).description ?? i})` : v