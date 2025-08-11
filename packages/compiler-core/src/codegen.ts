export interface CodegenResult {
  code: string
  ast: any
  preamble: string
  map?: any
}
export function generate(
  ast: any,
  options: any = {},
): any {}