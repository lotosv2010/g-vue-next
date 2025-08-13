import { isString } from "@g-vue-next/shared"
import { TransformContext } from "./transform"
import { CREATE_VNODE, CREATE_ELEMENT_VNODE, OPEN_BLOCK, CREATE_BLOCK, CREATE_ELEMENT_BLOCK, WITH_DIRECTIVES } from "./runtimeHelpers"

export type Namespace = number

export enum Namespaces {
  HTML,
  SVG,
  MATH_ML,
}

export enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION,
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT,
}

export enum ElementTypes {
  ELEMENT,
  COMPONENT,
  SLOT,
  TEMPLATE,
}

export enum ConstantTypes {
  NOT_CONSTANT = 0,
  CAN_SKIP_PATCH,
  CAN_HOIST,
  CAN_STRINGIFY,
}

export interface Node {
  type: NodeTypes
  loc: SourceLocation
}

// The node's range. The `start` is inclusive and `end` is exclusive.
// [start, end)
export interface SourceLocation {
  start: Position
  end: Position
  source: string
}

export interface Position {
  offset: number // from start of file
  line: number
  column: number
}

export type TemplateChildNode = any

export interface RootNode extends Node {
  type: NodeTypes.ROOT
  source: string
  children: TemplateChildNode[]
  helpers: Set<symbol>
  components: string[]
  directives: string[]
  hoists: any[]
  imports: any[]
  cached: number
  temps: number
  codegenNode?: any
  transformed?: boolean
}

export type ParentNode = RootNode 

export interface VNodeCall extends Node {
  type: NodeTypes.VNODE_CALL
  tag: string
  props: any
  children: any
  patchFlag: string
  dynamicProps: string
  directives: any
  isBlock: boolean
  disableTracking: boolean
  isComponent: boolean

}

export const locStub = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
  source: ''
}
export function createRoot(children: TemplateChildNode[], source = ''): RootNode {
  return {
    type: NodeTypes.ROOT,
    source,
    children,
    helpers: new Set(),
    components: [],
    directives: [],
    hoists: [],
    imports: [],
    cached: 0,
    temps: 0,
    codegenNode: null,
    loc: locStub
  }
}

export function createCompoundExpression(
  children: TemplateChildNode[],
  loc: SourceLocation
) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    children,
    loc
  }
}

export function createCallExpression(
  callee,
  args,
  loc = locStub
) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args,
    loc
  }
}

export function getVNodeHelper(
  ssr: boolean,
  isComponent: boolean,
): typeof CREATE_VNODE | typeof CREATE_ELEMENT_VNODE {
  return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE
}

export function getVNodeBlockHelper(
  ssr: boolean,
  isComponent: boolean,
): typeof CREATE_BLOCK | typeof CREATE_ELEMENT_BLOCK {
  return ssr || isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK
}

export function createVNodeCall(
  context: TransformContext | null,
  tag: string,
  props?: any,
  children?: any,
  patchFlag?: any,
  dynamicProps?: any,
  directives?: any,
  isBlock = false,
  disableTracking = false,
  isComponent = false,
  loc = locStub
) {
  if (context) {
    if (isBlock) {
      context.helper(OPEN_BLOCK)
      context.helper(getVNodeBlockHelper(context.inSSR, isComponent))
    } else {
      context.helper(getVNodeHelper(context.inSSR, isComponent))
    }
    if (directives) {
      context.helper(WITH_DIRECTIVES)
    }
  }
  return {
    // callee: context && context.helper(CREATE_VNODE), 
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent,
    loc
  }
}

export function createObjectExpression(
  properties,
  loc = locStub
) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties,
    loc
  }
}

export function createObjectProperty(
  key,
  value
) {
  return {
    type: NodeTypes.JS_PROPERTY,
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value,
    loc: locStub
  }
}

export function createSimpleExpression(
  content,
  isStatic = false,
  loc = locStub,
  constType = ConstantTypes.NOT_CONSTANT
) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    isStatic,
    loc,
    content,
    constType: isStatic ? ConstantTypes.CAN_STRINGIFY : constType,
  }
}

export function convertToBlock(
  node: VNodeCall,
  { helper, removeHelper, inSSR }: TransformContext
) {
  if (!node.isBlock) {
    node.isBlock = true
    removeHelper(getVNodeHelper(inSSR, node.isComponent))
    helper(OPEN_BLOCK)
    helper(getVNodeBlockHelper(inSSR, node.isComponent))
  }
}