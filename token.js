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
  ['puncBang', /^\!/],
  ['puncComma', /^,/],
  ['puncSemi', /^;/],
  ['puncSemi', /^;/],
  ['puncAt', /^@/],
  [
    'keywordFn',
    /^fn((?=[-\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s])|$)/,
  ],
  [
    'keywordLet',
    /^let((?=[-\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s])|$)/,
  ],
  [
    'keywordMut',
    /^mut((?=[\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s])|$)/,
  ],
  [
    'keywordMut',
    /^mut((?=[\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s])|$)/,
  ],
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
  ['opSub', /^\-/],
  ['opMul', /^\*/],
  ['opDiv', /^\//],
  ['opMod', /^%/],
  ['literalFloat', /^[0-9]+\.[0-9]+/],
  ['literalInt', /^[0-9]+/],
  [
    'literalBool',
    /^(true|false)((?=[\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s])|$)/,
  ],
  [
    'identifier',
    /^[^-0-9\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s][^-\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s]*/,
  ],
  ['literalString', /^("([^"]|(\\"))+?")|('([^']|(\\'))+?')/],
  ['unexpected', /^.+/],
]

/**
 * 分词
 * @param {string} src
 * @returns {import("./types").TokenUnknown[]}
 */
export function tokenize(src) {
  /** @type {import("./types").TokenUnknown[]} */
  const tokens = []
  while (src.length > 0) {
    src = src.trimStart()
    for (const [type, regex] of TOKENS_REGEX) {
      const res = regex.exec(src)
      if (res) {
        const token = {
          type,
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
            src.replace(regex, '')
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
        break
      }
    }
  }
  return tokens
}
