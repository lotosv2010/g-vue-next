import { PatchFlags } from "@g-vue-next/shared";
import { createCallExpression, createCompoundExpression, NodeTypes } from "../ast";
import { NodeTransform } from "../options";
import { isText } from "../utils";
import { CREATE_TEXT } from "../runtimeHelpers";

export const transformText: NodeTransform = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH

  ) {
    // ⚠️：注意处理顺序，这里要等待子节点处理完毕，再赋值给父节点
    return () => {
      const children = node.children
      let currentContainer: any = undefined
      let hasText = false

      for(let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child)) {
          hasText = true
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression([child], child.loc)
              }
              currentContainer.children.push(' + ', next) // 添加 
              children.splice(j, 1) // 删除
              j--
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }

      // 判断有没有剩余的文本, 没有就不需要 createTextVNode 
      if (!hasText || children.length === 1) {
        return
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs = []
          if (child.type !== NodeTypes.TEXT || child.content !== ' ') {
            callArgs.push([child, PatchFlags.TEXT])
          }
          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(
              context.helper(CREATE_TEXT),
              callArgs
            )
          }
        }
      }
    }
  }
}

