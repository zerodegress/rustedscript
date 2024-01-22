export class TokenizeError extends Error {}

/**
 * @type {[import("./types").TokenUnknown['type'], RegExp][]}
 */
const TOKENS_REGEX = [
  ['lineComment', /^\/\/.*$/],
  ['puncParrenLeft', /^\(/],
  ['puncParrenRight', /^\)/],
  ['puncBraceLeft', /^\{/],
  ['puncBraceRight', /^\}/],
  ['puncBracketLeft', /^\[/],
  ['puncBracketRight', /^\]/],
  ['puncDot', /^\./],
  ['puncBang', /^!/],
  ['puncComma', /^,/],
  ['puncSemi', /^;/],
  ['puncSemi', /^;/],
  ['puncAt', /^@/],
  ['keywordFn', /^fn((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/],
  ['keywordLet', /^let((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/],
  ['keywordMut', /^mut((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/],
  ['keywordIf', /^if((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/],
  ['keywordElse', /^else((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/],
  ['keywordWhile', /^while((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/],
  ['keywordFor', /^for((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/],
  ['opGt', /^>/],
  ['opGe', /^>=/],
  ['opLt', /^</],
  ['opLe', /^<=/],
  ['opEq', /^==/],
  ['opNe', /^!=/],
  ['opAnd', /^&&/],
  ['opOr', /^\|\|/],
  ['opAssign', /^=/],
  ['opAdd', /^\+/],
  ['opSub', /^-/],
  ['opMul', /^\*/],
  ['opDiv', /^\//],
  ['opMod', /^%/],
  ['literalFloat', /^(\+|-)?[0-9]+\.[0-9]+/],
  ['literalInt', /^(\+|-)?[0-9]+/],
  [
    'literalBool',
    /^(true|false)((?=[-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s])|$)/,
  ],
  [
    'identifier',
    /^[^-0-9()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s][^-()[\]{}\\/.,<>;:'"\\|`~!@#$%^&*?+=\s]*/,
  ],
  ['literalString', /^("([^"]|(\\"))+?")|('([^']|(\\'))+?')/],
  ['unexpected', /^.+/],
]

/**
 * 分词
 * @param {string} src
 * @param {import("./types").TokenizeOptions} [options]
 * @returns {import("./types").TokenUnknown[]}
 */
export function tokenize(src, options) {
  /** @type {import("./types").TokenUnknown[]} */
  const tokens = []
  let curOffset = 0
  while (src.length > 0) {
    const oldSrc = src
    src = src.trimStart()
    curOffset += oldSrc.length - src.length
    for (const [type, regex] of TOKENS_REGEX) {
      const res = regex.exec(src)
      if (res) {
        const token = {
          type,
        }
        if (options?.withRange) {
          token.offset = curOffset
          token.length = res[0].length
        }
        switch (type) {
          case 'identifier':
          case 'literalInt':
          case 'literalFloat':
          case 'literalString':
          case 'literalBool':
            token.content = res[0]
            break
          case 'lineComment':
          case 'blockComment':
            token.content = res[0]
            break
          case 'unexpected':
            throw new TokenizeError('unexpected token')
        }
        switch (token.type) {
          default:
            tokens.push(token)
            break
          case 'lineComment':
          case 'blockComment':
            break
        }
        src = src.replace(regex, '')
        curOffset += res[0].length
        break
      }
    }
  }
  return tokens
}
