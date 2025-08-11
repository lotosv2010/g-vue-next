import { ParseOptions } from "@g-vue-next/compiler-core";
import { isHTMLTag, isMathMLTag, isSVGTag, isVoidTag } from "@g-vue-next/shared";

export const parserOptions: ParseOptions = {
  parseMode: 'html',
  isVoidTag,
  isNativeTag: tag => isHTMLTag(tag) || isSVGTag(tag) || isMathMLTag(tag),
  isPreTag: tag => tag === 'pre',
  isBuiltInComponentTag: tag => tag === 'Transition' || tag === 'TransitionGroup',
}