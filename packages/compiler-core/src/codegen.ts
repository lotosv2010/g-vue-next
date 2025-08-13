import { isArray, isNil, isString, isSymbol } from "@g-vue-next/shared"
import { getVNodeBlockHelper, getVNodeHelper, NodeTypes, RootNode, TemplateChildNode, VNodeCall } from "./ast"
import { CodegenOptions } from "./options"
import { helperNameMap, OPEN_BLOCK, TO_DISPLAY_STRING } from "./runtimeHelpers"
import { isText } from "./utils"

export interface CodegenResult {
  code: string
  ast: any
  preamble: string
  map?: any
}

export type CodegenNode = TemplateChildNode | any

export interface CodegenContext extends Omit<Required<CodegenOptions>, 'bindingMetadata' | 'inline'> {
  source: string
  code: string
  line: number
  column: number
  offset: number
  indentLevel: number
  pure: boolean
  map?: any
  helper(key: symbol): string
  push(code: string, newLineIndex?: number, node?: CodegenNode): void
  indent(): void
  deindent(withoutNewLine?: boolean): void
  newline(): void
}

enum NewLineType {
  Start = 0,
  End = -1,
  None = -2,
  Unknown = -3
}

function createCodegenContext(
  ast: RootNode,
  {
    mode = 'function',
    prefixIdentifiers = mode === 'module',
    sourceMap = false,
    filename = 'template.vue.html',
    scopeId = null,
    optimizeImports = false,
    runtimeGlobalName = 'Vue',
    runtimeModuleName = `vue`,
    ssrRuntimeModuleName = `vue/server-renderer`,
    ssr = false,
    isTS = false,
    inSSR = false
  }: CodegenOptions
): CodegenContext {
  const context: CodegenContext = {
    mode,
    prefixIdentifiers,
    sourceMap,
    filename,
    scopeId,
    optimizeImports,
    runtimeGlobalName,
    runtimeModuleName,
    ssrRuntimeModuleName,
    ssr,
    isTS,
    inSSR,
    source: ast.source,
    code: ``,
    column: 1,
    line: 1,
    offset: 0,
    indentLevel: 0,
    pure: false,
    map: undefined,
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code, newLineIndex = NewLineType.None, node) {
      context.code += code
    },
    indent() {
      newline(++context.indentLevel)
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }
    },
    newline() {
      newline(context.indentLevel)
    }
  }

  function newline(n: number) {
    context.push('\n' + `  `.repeat(n), NewLineType.Start)
  }

  return context
}

function genFunctionPreamble(ast: RootNode, context: CodegenContext) {
  const { push, newline, deindent, indent, runtimeGlobalName, helper } = context
  const VueBinding = runtimeGlobalName
  const helpers = Array.from(ast.helpers)

  if (helpers.length > 0) {
    // push(`const _Vue = ${VueBinding}\n`, NewLineType.End)
    push(`const { ${helpers.map(s => `${helperNameMap[s]}: ${helper(s)}`).join(', ')} } = ${VueBinding}\n`)
  }

  newline()
  push(`return `)
}

function genNullableArgs(
  args: any[]
) {
  let i = args.length
  while(i--) {
    if (!isNil(args[i])) break
  }
  return args.slice(0, i + 1).map(arg => arg || `null`)
}

function genNodeListAsArray(
  nodes: (string | CodegenNode | TemplateChildNode)[],
  context: CodegenContext
) {
  const multilines = nodes.length > 3 || nodes.some(n => isArray(n) || !isText(n))
  context.push(`[`)
  multilines && context.indent()
  genNodeList(nodes, context, multilines)
  multilines && context.deindent()
  context.push(']')
}

function genNodeList(
  nodes: (string | symbol | CodegenNode | TemplateChildNode)[],
  context: CodegenContext,
  multilines: boolean = false,
  comma: boolean = true
) {
  const { push, newline } = context
  
  for(let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(node, NewLineType.Unknown)
    } else if (isArray(node)) {
      genNodeListAsArray(node, context)
    } else {
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      if (multilines) {
        comma && push(',')
        newline()
      } else {
        comma && push(', ')
      }
    }
  }
}

function genVNodeCall(node: VNodeCall, context: CodegenContext) {
  const { push, helper} = context
  const { tag, props, children, patchFlag, isBlock, isComponent, dynamicProps} = node
  let patchFlagString
  if (patchFlag) {
    patchFlagString = String(patchFlag)
  }

  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${``}), `)
  }

  const callHelper = isBlock
    ? getVNodeBlockHelper(context.inSSR, isComponent)
    : getVNodeHelper(context.inSSR, isComponent)

  push(helper(callHelper) + `(`, NewLineType.None, node)
  
  genNodeList(
    genNullableArgs([tag, props, children, patchFlagString, dynamicProps]),
    context
  )
  push(`)`)
  if (isBlock) {
    push(`)`)
  }
}

function genText(
  node,
  context: CodegenContext
) {
  context.push(JSON.stringify(node.content), NewLineType.Unknown, node)
}

function genCallExpression(
  node: RootNode | any,
  context: CodegenContext
) {
  const { push, helper } = context
  const callee = isString(node.callee) ? node.callee : helper(node.callee)
  push(callee + `(`, NewLineType.None, node)
  genNodeList(node.arguments, context)
  push(')')
}

function genObjectExpression(
  node: RootNode | any,
  context: CodegenContext
) {
  const { push, indent, deindent, newline } = context
  const { properties } = node
  if (!properties.length) {
    push(`{}`, NewLineType.None, node)
    return
  }
  const multilines = properties.length > 1
  push(multilines ? `{` : `{ `)
  multilines && indent()
  for (let i = 0; i < properties.length; i++) {
    const {key, value} = properties[i]
    genExpressionAsPropertyKey(key, context)
    push(`: `)
    genNode(value, context)
    if (i < properties.length - 1) {
      push(',')
      newline()
    }
  }
  multilines && deindent()
  push(multilines ? `}` : ` }`)
}

function genExpressionAsPropertyKey(
  node: RootNode | any,
  context: CodegenContext
) {
  const { push } = context
  if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
    push('[')
    genCompoundExpression(node, context)
    push(']')
  } else if (node.isStatic) {
    const text = JSON.stringify(node.content)
    push(text, NewLineType.None, node)
  } else {
    push(`${node.content || node}`, NewLineType.Unknown, node)
  }
}

function genCompoundExpression(
  node: RootNode | any,
  context: CodegenContext
) {
  for (let i = 0; i < node.children?.length; i++) {
    const child = node.children[i]
    if (isString(child)) {
      context.push(child, NewLineType.Unknown)
    } else {
      genNode(child, context)
    }
  }
}

function genInterpolation(
  node: RootNode | any,
  context: CodegenContext
) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

function genExpression(
  node: RootNode,
  context: CodegenContext
) {
  const { content, isStatic } = node as any
  context.push(
    isStatic ? JSON.stringify(content) : content,
    NewLineType.Unknown,
    node
  )
}

function genNode(node: CodegenNode | symbol | string, context: CodegenContext) {
  if (isString(node)) {
    context.push(node, NewLineType.Unknown)
    return
  }
  if (isSymbol(node)) {
    context.push(context.helper(node))
    return
  }
  switch(node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.IF:
    case NodeTypes.FOR:
      genNode(node.codegenNode, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context)
      break
    case NodeTypes.JS_OBJECT_EXPRESSION:
      genObjectExpression(node, context)
      break
    default:
      console.log(node?.type, node?.codegenNode)
      break
  }
}

export function generate(
  ast: RootNode,
  options: any = {},
): any {
  const context = createCodegenContext(ast, options)
  const { ssr, push, indent, deindent } = context

  const isSetupInlined = !!options.inline
  const preambleContext = isSetupInlined ? createCodegenContext(ast, options) : context
  // 生成函数前言
  genFunctionPreamble(ast, context)

  const functionName = ssr ? 'ssrRender' : 'render'
  const args = ssr ? ['_ctx', '_push', '_parent', '_attrs'] : ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}) {`)
  indent()

  if (!ssr) {
    push(`return `)
  }
  
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  deindent()
  push(`}`)

  return {
    ast,
    code: context.code,
    preamble: isSetupInlined? preambleContext.code : ``,
    map: context.map ? context.map.toJSON() : undefined,
  }
}