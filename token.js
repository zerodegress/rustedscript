/**
 * @type {[import("./types").TokenUnknown['type'], RegExp][]}
 */
const TOKENS_REGEX = [
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
    'identifier',
    /^[^-0-9\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s][^-\(\)\[\]\{\}\\\/\.,<>;:'"\\|`~!@#\$%^&\*\?\+=\s]*/,
  ],
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
            token.content = res[0]
            break
        }
        tokens.push(token)
        src = src.replace(regex, '')
        break
      }
    }
  }
  return tokens
}
