import { tokenize } from './token.js'
import { parse } from './parse.js'
import { compile as compileNode } from './compile.js'
import { compile as compileRWASM, optimize as optimizeRWASM } from './rwasm.js'
import { compile as compileRWIni, optimize as optimizeRWIni } from './rwini.js'

export {
  tokenize,
  parse,
  compileNode,
  compileRWASM,
  compileRWIni,
  optimizeRWASM,
  optimizeRWIni,
}

/** @type {(src: string) => string} */
export function compile(src) {
  return compileRWIni(
    optimizeRWIni(
      compileRWASM(optimizeRWASM(compileNode(parse(tokenize(src))))),
    ),
  )
}
