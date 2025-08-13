import { EMPTY_OBJ, isArray, isString, NOOP, PatchFlagNames, PatchFlags } from "@g-vue-next/shared"
import { convertToBlock, createVNodeCall, NodeTypes, ParentNode, RootNode, TemplateChildNode } from "./ast"
import { ErrorHandler, CompilerOptions, TransformOptions } from "./options"
import { CREATE_COMMENT, FRAGMENT, TO_DISPLAY_STRING } from "./runtimeHelpers"

export interface TransformContext extends ErrorHandler, CompilerOptions {
  selfName: string | null
  root: RootNode
  helpers: Map<symbol, number>
  components: Set<string>
  directives: Set<string>
  hoists: (any[] | null)[]
  imports: any[]
  temps: number
  cached: number
  identifiers: { [name: string]: number | undefined }
  scopes: {
    vFor: number
    vSlot: number
    vPre: number
    vOnce: number
  }
  parent: ParentNode | null
  grandparent: ParentNode | null
  childIndex: number
  inVOnce: boolean
  helper<T extends symbol>(name: T): T
  removeHelper<T extends symbol>(name: T): void
  helperString(name: symbol): string
  replaceNode(node: TemplateChildNode): void
  removeNode(node?: TemplateChildNode): void
  onNodeRemoved(): void
  addIdentifiers(exp: any): void
  removeIdentifiers(exp: any): void
  hoist(exp: any, code: any): any
  cache(exp: any, isVNode: boolean): any
  constantCache: WeakMap<any, any>
}

export function createTransformContext(root: any, options: TransformOptions): TransformContext {
  const nameMatch = options.filename?.replace(/\?.*$/, '')?.match(/([^/\\]+)\.\w+$/)
  const context: TransformContext = {
    // options
    filename: options.filename ?? '',
    selfName: nameMatch,
    prefixIdentifiers: options.prefixIdentifiers ?? false,
    hoistStatic: options.hoistStatic ?? false,
    hmr: options.hmr ?? false,
    cacheHandlers: options.cacheHandlers ?? false,
    nodeTransforms: options.nodeTransforms ?? [],
    directiveTransforms: options.directiveTransforms ?? {},
    transformHoist: options.transformHoist ?? null,
    isBuiltInComponent: options.isBuiltInComponent ?? NOOP,
    isCustomElement: options.isCustomElement ?? NOOP,
    expressionPlugins: options.expressionPlugins ?? [],
    scopeId: options.scopeId ?? null,
    slotted: options.slotted ?? true,
    ssr: options.ssr ?? false,
    inSSR: options.ssr ?? false,
    ssrCssVars: options.ssrCssVars ?? '',
    bindingMetadata: options.bindingMetadata ?? EMPTY_OBJ,
    inline: options.inline ?? false,
    isTS: options.isTS ?? false,
    onError: options.onError ?? NOOP,
    onWarn: options.onWarn ?? NOOP,
    compatConfig: options.compatConfig,
    // state
    root,
    helpers: new Map(),
    components: new Set(),
    directives: new Set(),
    hoists: [],
    imports: [],
    constantCache: new WeakMap(),
    temps: 0,
    cached: 0,
    identifiers: Object.create(null),
    scopes: {
      vFor: 0,
      vSlot: 0,
      vPre: 0,
      vOnce: 0
    },
    parent: null,
    grandparent: null,
    currentNode: root,
    childIndex: 0,
    inVOnce: false,
    // methods
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    },
    removeHelper(name) {
      const count = context.helpers.get(name)
      if (count) {
        const currentCount = count - 1
        if (!currentCount) {
          context.helpers.delete(name)
        } else {
          context.helpers.set(name, currentCount)
        }
      }
    },
    helperString(name) {
      return `${name as any}`
    },
    replaceNode(node) {},
    removeNode(node) {},
    onNodeRemoved: NOOP,
    addIdentifiers(exp) {},
    removeIdentifiers(exp) {},
    hoist(exp, code) {
      return NOOP
    },
    cache(exp, isVNode) {
      return exp
    }
  }
  return context
}

export function transform(root: any, options: any) {
  // 创建上下文
  const context = createTransformContext(root, options)
  // 深度优先遍历树形结构
  traverseNode(root, context)

  // 对根节点的处理
  createRootCodegen(root, context)
  root.helpers = new Set([...context.helpers.keys()])
  root.transformed = true
}

function getSingleElementRoot(
  root: RootNode
) {
  const children = root.children.filter(x => x.type !== NodeTypes.COMMENT)
  return children.length === 1 && children[0].type === NodeTypes.ELEMENT ? children[0] : null
}

function createRootCodegen(root: RootNode, context: any) {
  const { helper } = context
  const { children } = root
  if (children.length === 1) {
    const singleElementRootChild = getSingleElementRoot(root)
    if (singleElementRootChild && singleElementRootChild.codegenNode) { // 元素节点
      const codegenNode = singleElementRootChild.codegenNode
      if (codegenNode.type === NodeTypes.VNODE_CALL) {
        convertToBlock(codegenNode, context)
      }
      root.codegenNode = codegenNode
    } else { // 文本节点
      root.codegenNode = children[0]
    }
  } else if (children.length > 1) {
    let patchFlag = PatchFlags.STABLE_FRAGMENT
    let patchFlagText = PatchFlagNames[PatchFlags.STABLE_FRAGMENT]
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      undefined,
      root.children,
      patchFlag,
      undefined,
      undefined,
      true,
      undefined,
      false
    )
  } else {
    // no children = noop.codegen will return null
  }
}

export function traverseChildren(
  parent: ParentNode,
  context: TransformContext
) {
  let i = 0;
  const nodeRemoved = () => {
    i--
  }
  for(; i < parent.children.length; i++) {
    const child = parent.children[i]
    if (isString(child)) continue
    context.grandparent = context.parent
    context.parent = parent
    context.childIndex = i
    context.onNodeRemoved = nodeRemoved
    traverseNode(child, context)
  }
}

export function traverseNode(
  node: RootNode | TemplateChildNode,
  context: TransformContext
) {
  context.currentNode = node
  const { nodeTransforms } = context
  const exitFns = []

  for(let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      if (isArray(onExit)) {
        exitFns.push(...onExit)
      } else {
        exitFns.push(onExit)
      }
    }
    if (!context.currentNode) {
      // node was removed
      return
    } else {
      // node may have been replaced
      node = context.currentNode
    }
  }

  switch (node.type) {
    case NodeTypes.COMMENT:
      context.helper(CREATE_COMMENT)
      break
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.IF:
      for(let i = 0; i < node?.branches?.length;i++) {
        traverseNode(node.branches[i], context)
      }
      break
    case NodeTypes.IF_BRANCH:
    case NodeTypes.FOR:
    case NodeTypes.ELEMENT: 
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
  }

  // 还原上一次的currentNode，因为执行 traverseNode 时，会改变 currentNode 为子节点 
  context.currentNode = node

  // 倒序执行
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}