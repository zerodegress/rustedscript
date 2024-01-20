import { tokenize } from './token.js'
import { parse } from './parse.js'
import { compile as compileToRWASM } from './compile.js'
import { compile as compileToRWIni, optimize } from './rwasm.js'
import { compile as compileToString } from './rwini.js'

/** @type {(src: string) => string} */
export function compile(src) {
  return compileToString(
    compileToRWIni(optimize(compileToRWASM(parse(tokenize(src))))),
  )
}
