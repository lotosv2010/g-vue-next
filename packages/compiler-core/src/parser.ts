import { createRoot, NodeTypes } from "./ast"

export interface ParserContext {
  originalSource: string
  source: string
  line: number
  column: number
  offset: number
}

function createParserContext(content: string): ParserContext {
  return {
    originalSource: content,
    source: content,
    line: 1,
    column: 1,
    offset: 0,
  }
}

function isEnd(context: ParserContext) {
  const c = context.source
  // 如果源字符串中包含有 </ 字符串，则为 停止
  if (c.startsWith('</')) {
    return true
  }
  return !c
}

function advanceBy(context: ParserContext, length: number) {
  const str = context.source
  context.source = context.source.slice(length)
  advancePositionWithMutation(context, str, length)
}

function advanceSpaces(context: ParserContext) {
  const match = /^[ \t\r\n]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function advancePositionWithMutation(context: ParserContext, str: string, endIndex: number) {
  let linesCount = 0
  let returnLine = -1
  for (let i = 0; i < endIndex; i++) { 
    // 如果是换行，需要换行处理
    if (str.charCodeAt(i) === 10) {
      linesCount++
      returnLine = i // 记录回车换行的索引
    }
  }
  context.line += linesCount // 计算行号
  context.offset += endIndex // 计算偏移量
  // 计算列数
  context.column = returnLine === -1 ? context.column + endIndex : endIndex - returnLine
}

function parseTextData(context: ParserContext, length: number): string {
  
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText.replace(/[\n\t\r\f ]+/g, ' ').trim()
}

function parseText(context: ParserContext): any {
  const tokes = ['<', '{{'] // 找当前离得最近的开始token
  let endIndex = context.source.length // 假设结束索引值为源代码的长度

  for(let i =0; i < tokes.length; i++) {
    const index = context.source.indexOf(tokes[i], 1)
    if (index > -1 && endIndex > index) {
      endIndex = index
    }
  }
  const start = getCursor(context)
  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  }
}

function getCursor(context: ParserContext): any {
  const { offset, column, line } = context
  return { offset, line, column }
}

function getSelection(context: ParserContext, start: any, end?: any) {
  if (!end) {
    end = getCursor(context)
  }
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  }
}

function isQuote(text: string) {
  return text === '"' || text === "'" || text === '`'
}

function parseAttributeValue(context: ParserContext): any {
  let content
  const quote = context.source[0]

  if (isQuote(quote)) {
    advanceBy(context, 1)
    const endIndex = context.source.indexOf(quote)
    content = parseTextData(context, endIndex)
    advanceBy(context, 1)
  } else {
    advanceSpaces(context)
    content = context.source.match(/([^ \t\r\n/>])+/)[1]
    advanceBy(context, content.length)
    advanceSpaces(context)
  }
  return content
}

function parseAttribute(context: ParserContext) {
  const start = getCursor(context)
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  const name = match[0]
  advanceBy(context, name.length)
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1) // 删除=
  }
  
  const content = parseAttributeValue(context)
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      content,
      loc: getSelection(context, start)
    },
    loc: getSelection(context, start)
  }
}

function parseAttributes(context: ParserContext) {
  const attributes = []

  while(context.source.length > 0 && !context.source.startsWith('>')) {
    const attr = parseAttribute(context)
    attributes.push(attr)
    advanceSpaces(context)
  }

  return attributes
}

function parseTag(context: ParserContext) {
  const start = getCursor(context)
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)
  if (match) {
    const tag = match[1]
    advanceBy(context, match[0].length)

    // 移除空格
    advanceSpaces(context)

    //  解析标签的属性
    const props = parseAttributes(context)

    let isSelfClosing = context.source.startsWith('/>')
    advanceBy(context, isSelfClosing ? 2 : 1)
    return {
      type: NodeTypes.ELEMENT,
      tag,
      isSelfClosing,
      loc: getSelection(context, start),
      props
    }
  }
}

function parseElement(context: ParserContext) {
  const ele: any = parseTag(context)

  // 递归解析子节点, 如果是 闭合 标签，需要跳过
  const children = parseChildren(context)

  // 移除标签的 闭合 部分
  if (context.source.startsWith('</')) {
    parseTag(context)
  }
  
  ele.children = children
  ele.loc = getSelection(context, ele.loc.start)

  return ele
}

function parseInterpolation(context: ParserContext) {
  const start = getCursor(context)
  const endIndex = context.source.indexOf('}}')

  advanceBy(context, 2)

  const innerStart = getCursor(context)
  const innerEnd = getCursor(context)
  
  const contentIndex = endIndex - 2
  let rawContent = parseTextData(context, contentIndex)
  const content = rawContent.trim()

  const startOffset = rawContent.indexOf(content)

  if (startOffset > 0) {
    //  更新开始位置
    advancePositionWithMutation(innerStart, rawContent, startOffset)
  }

  const endOffset = content.length + startOffset
  // 更新结束位置
  advancePositionWithMutation(innerEnd, rawContent, endOffset)

  advanceBy(context, 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  }
}

function parseChildren(context: ParserContext) {
  const nodes = []
  while(!isEnd(context)) {
    let node 
    const { source: c } = context
    // 状态机(有限状态机)
    if (c.startsWith('{{')) { // 表达式，{{ name }}
      node = parseInterpolation(context)
    } else if (c.startsWith('<')) { // 元素，<div></div>
      node = parseElement(context)
    } else { // 文本，text
      node = parseText(context)
    }
    nodes.push(node)
  }

  const isWhitespace = (source: string) => {
    return !/[^\t\r\n\f ]/.test(source.trim())
  }

  // 移除空节点等
  const result = nodes.filter((node: any) => {
    if (node.type === NodeTypes.TEXT) {
      return !isWhitespace(node.content.trim())
    }
    return true
  })
  return result
}

export function baseParse(input: string, options?: any) {
  const context = createParserContext(input)
  const children = parseChildren(context)
  const root = createRoot(children)
  return  root
}