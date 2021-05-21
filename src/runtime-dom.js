// 运行时的包，里面放着 dom 操作的方法
export const nodeOps = {
  insert(child, parent, anchor) {
    if(anchor) {
      parent.insertBefore(child, anchor);
    } else {
      parent.appendChild(child)
    }
  },
  remove(child) {
    const parent = child.parentNode
    parent && parent.removeChild(child)
  },
  createElement(tag) {
    return document.createElement(tag)
  },
  hostSetElementText(el, text) {
    el.textContent = text
  },
  // 属性操作...
  hostPatchProps(el, key, preProps, nextProps) {
    if(/^on[^a-z]/.test(key)) { // 事件，例如onClick
      const eventName = key.slice(2).toLowerCase()
      // 更新事件
      preProps && el.removeEventListener(eventName, preProps)
      nextProps && el.addEventListener(eventName, nextProps)
    } else { // 其他属性
      if(nextProps == null) {
        return el.removeAttribute(key)
      }
      if(key === 'style') {
        for (const k in nextProps) {
          if (nextProps.hasOwnProperty(k)) {
            el.style[k] = nextProps[k]
          }
        }
        for (const k in preProps) {
          if (!nextProps.hasOwnProperty(k)) {
            el.style[k] = null
          }
        }
      } else {
        el.setAttribute(key, nextProps)
      }
    }
  }
}