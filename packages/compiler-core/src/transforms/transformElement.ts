import { createObjectExpression, createVNodeCall, ElementTypes, NodeTypes } from "../ast";
import { NodeTransform } from "../options";

export const transformElement: NodeTransform = (node, context) => { 
  if (node.type === NodeTypes.ELEMENT) {
    
  }
  return function postTransformElement() {
    node = context.currentNode
    if (
      !(
        node.type === NodeTypes.ELEMENT
        // && (node.tagType === ElementTypes.ELEMENT || node.tagType === ElementTypes.COMPONENT)
      )
    ) {
      return
    }
    const { tag, props, children } = node
    let vnodeTag = `"${tag}"`
    let vnodeProps: any = []
    let vnodeChildren: any
    let patchFlag: any | 0 = 0

    // props
    if (props?.length > 0) {
      for(let i = 0; i < props.length; i++) {
        const { name, value: { content } } = props[i]
        vnodeProps.push({
          key: name,
          value: content
        })
      }
      const propsBuildResult = vnodeProps.length > 0 ? createObjectExpression(vnodeProps) : null
      vnodeProps = propsBuildResult
    }
    // children
    if (children.length === 1) {
      const child = children[0]
      vnodeChildren = child
    } else if (children.length > 1) {
      vnodeChildren = children
    }

    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      patchFlag === 0 ? undefined : patchFlag,
      undefined,
      undefined,
      false,
      false,
      false,
      node.loc  
    )
  }
}