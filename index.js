import { tokenize } from './token.js'
import { parse } from './parse.js'
import { compile as compileToRWASM } from './compile.js'
import {
  compile as compileToRWIni,
  optimize as optimizeRWASM,
} from './rwasm.js'
import {
  compile as compileToString,
  optimize as optimizeRWIni,
} from './rwini.js'

/** @type {(src: string) => string} */
export function compile(src) {
  return compileToString(
    optimizeRWIni(
      compileToRWIni(optimizeRWASM(compileToRWASM(parse(tokenize(src))))),
    ),
  )
}
