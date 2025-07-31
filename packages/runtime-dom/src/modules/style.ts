type Style = Record<string, string> | null

export function patchStyle(el: Element, prev: Style, next: Style) {
  // 新的样式存在
  if (next) {
    // 获取样式对象
    const style = (el as HTMLElement).style
    // 遍历新的样式对象，将新的样式对象逐个进行添加
    for (const key in next) { 
      style.setProperty(key, next[key])
    }
    // 遍历老的样式对象，将老的样式对象逐个进行移除
    for (const key in prev) {
      if (!next[key]) {
        style.setProperty(key, '')
      }
    }
  } else { // 新的样式不存在
    el.removeAttribute('style')
  }
}