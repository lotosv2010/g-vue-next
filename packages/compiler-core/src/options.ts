import { ParentNode, RootNode, TemplateChildNode } from "./ast"
import { TransformContext } from "./transform"

export interface ErrorHandler {
  onWarn?: (warning: any) => void
  onError?: (err: any) => void
}

export type CompilerOptions = any

export interface ParseOptions extends ErrorHandler {
  parseMode?: 'base' | 'html' | 'sfc'
  ns?: any
  isNativeTag?: (tag: string) => boolean
  isVoidTag?: (tag: string) => boolean
  isPreTag?: (tag: string) => boolean
  isCustomElement?: (tag: string) => boolean
  isBuiltInComponentTag?: (tag: string) => boolean
  getNamespace?: (
    tag: string,
    parent: Element | undefined,
    rootNamespace: any
  ) => any
  delimiters?: [string, string]
  whitespace?: 'preserve' | 'condense'
  comments?: boolean
}

export type NodeTransform = (
  node: RootNode | TemplateChildNode,
  context: TransformContext
) => void | (() => void) | (() => void)[]

export interface TransformOptions extends ErrorHandler, CompilerOptions {
  nodeTransforms?: (NodeTransform | NodeTransform[])[]
  directiveTransforms?: Record<string, any>
  transformHoist?: NodeTransform | NodeTransform[]
  isBuiltInComponent?: (tag: string) => symbol | void
  isCustomElement?: (tag: string) => boolean | void
  prefixIdentifiers?: boolean
  hoistStatic?: boolean
  cacheHandlers?: boolean
  expressionPlugins?: any[]
  scopeId?: string | null
  slotted?: boolean
  ssrCssVars?: string
  hrm?: boolean
}