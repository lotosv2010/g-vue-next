import { baseCompile, baseParse, transform,generate, ParseOptions, CompilerOptions } from '@g-vue-next/compiler-core'
import { extend } from '@g-vue-next/shared'
import { parserOptions } from './parserOptions'
import { CodegenResult } from 'packages/compiler-core/src/codegen'

// TODO 编译三部曲
// 1.解析模板，生成ast
// 2.转换ast节点，主要针对指令进行处理
// 3.生成代码（ast 转换成 js）

export function compile(
  src: string,
  options: CompilerOptions = {}
): CodegenResult {
  return baseCompile(src, extend({}, parserOptions, options)) as any
}

export function parse(template: string, options: ParseOptions = {}) {
  return baseParse(template, extend({}, parserOptions, options))
}

export * from '@g-vue-next/compiler-core'