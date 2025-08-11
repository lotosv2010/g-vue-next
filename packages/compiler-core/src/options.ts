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