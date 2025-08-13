import { extend, NOOP } from "@g-vue-next/shared";
import { CompilerOptions, NodeTransform } from "./options";
import { baseParse } from "./parser";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformText } from "./transforms/transformText";
import { transformExpression } from "./transforms/transformExpression";
import { generate } from "./codegen";

export type TransformPreset = [
  NodeTransform[],
  Record<string, any>
]

export function getBaseTransformPreset(
  prefixIdentifiers?: boolean
): TransformPreset {
  return [
    [
      transformElement,
      transformText,
      transformExpression
    ],
    {
      on: NOOP,
      bind: NOOP,
      modal: NOOP
    }
  ]
}

export function baseCompile(
  source: string | any,
  options: CompilerOptions = {},
) {
  const resolvedOptions = extend({}, options, {
    prefixIdentifiers: true
  })
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset()
  const ast = baseParse(source)
  
  transform(ast, extend({}, resolvedOptions, {
    nodeTransforms: [
      ...nodeTransforms,
      ...(options.nodeTransforms || [])
    ],
    directiveTransforms: extend({}, directiveTransforms, options.directiveTransforms || {})
  }))

  return generate(ast, resolvedOptions)
}