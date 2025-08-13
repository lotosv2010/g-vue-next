import { NodeTypes, RootNode, TemplateChildNode } from "../ast";
import { NodeTransform } from "../options";
import { TransformContext } from "../transform";

export const transformExpression: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.INTERPOLATION) { // 插值
    node.content = processExpression(node.content, context);
  } else if (node.type === NodeTypes.ELEMENT) { // 元素
    // console.log('元素', node)
  }
}

function processExpression(node: RootNode | TemplateChildNode, context: TransformContext) {
  node.content = `_ctx.${node.content}`
  return node
}