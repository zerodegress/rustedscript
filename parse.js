class ParseError extends Error {}

function createOptRule(rule) {
  return tokens => {
    if (tokens.length <= 0) {
      return [tokens, null]
    }
    let res
    try {
      res = rule(tokens)
    } catch {
      return [tokens, null]
    }
    if (!res) {
      return [tokens, null]
    }
    return [res[0], res[1]]
  }
}

function createAltRule(...rules) {
  return tokens => {
    if (tokens.length <= 0) {
      throw new ParseError('unexpected eof')
    }
    for (const rule of rules) {
      let res
      try {
        res = rule(tokens)
      } catch {
        continue
      }
      if (!res) {
        continue
      }
      tokens = res[0]
      return [tokens, res[1]]
    }
    return null
  }
}

function createSeqRule(...rules) {
  return tokens => {
    if (rules.length <= 0) {
      return [tokens, []]
    }
    const results = []
    for (const rule of rules) {
      let res
      try {
        res = rule(tokens)
      } catch (e) {
        if (results.length <= 0) {
          throw e
        }
        return null
      }
      if (!res) {
        return null
      }
      tokens = res[0]
      results.push(res[1])
    }
    return [tokens, results]
  }
}

/**
 * @param {import("./types").TokenUnknown['type']} type
 */
function createConsTokenRule(type) {
  return tokens => {
    if (tokens.length <= 0) {
      throw new ParseError('unexpected eof')
    }
    if (tokens[0].type != type) {
      return null
    }
    /** @type {[import("./types").TokenUnknown[], string]} */
    return [tokens.slice(1), type]
  }
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleStatement(tokens) {
  const res = createAltRule(
    createSeqRule(ruleBlock),
    createSeqRule(ruleFunctionDeclaration),
    createSeqRule(ruleExpr, createConsTokenRule('puncSemi')),
  )(tokens)
  return res && [res[0], res[1][0]]
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown[]]?}
 */
function ruleStatements(tokens) {
  const res = createAltRule(
    createSeqRule(ruleStatement, ruleStatements),
    createSeqRule(ruleStatement),
  )(tokens)
  return (
    res && [
      res[0],
      res[1].length >= 2 ? [res[1][0], ...res[1][2]] : [res[1][0]],
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeBlock]?}
 */
function ruleBlock(tokens) {
  const res = createSeqRule(
    createConsTokenRule('puncBraceLeft'),
    createOptRule(ruleStatements),
    createConsTokenRule('puncBraceRight'),
  )(tokens)
  return (
    res && [
      res[0],
      {
        type: 'block',
        statements: res[1][1] || [],
      },
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeFunctionDeclaration]?}
 */
function ruleFunctionDeclaration(tokens) {
  const res = createSeqRule(
    createConsTokenRule('keywordFn'),
    ruleIdentifierExpr,
    createConsTokenRule('puncParrenLeft'),
    createOptRule(ruleTupleExpr),
    createConsTokenRule('puncParrenRight'),
    ruleBlock,
  )(tokens)
  return (
    res && [
      res[0],
      {
        type: 'functionDeclaration',
        identifier: res[1][1],
        params: res[1][3]?.exprs || [res[1][3]] || [],
        block: res[1][5],
      },
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleExpr(tokens) {
  return ruleTupleExpr(tokens)
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleTupleExpr(tokens) {
  const res = createAltRule(
    createSeqRule(
      ruleAssignExpr,
      createConsTokenRule('puncComma'),
      ruleTupleExpr,
    ),
    createSeqRule(ruleAssignExpr, createConsTokenRule('puncComma')),
    createSeqRule(ruleAssignExpr),
  )(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 3:
            return {
              type: 'tuple',
              exprs: [res[1][0], ...res[1][2].exprs],
            }
          case 2:
            return {
              type: 'tuple',
              exprs: [res[1][0]],
            }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleAssignExpr(tokens) {
  const res = createAltRule(
    createSeqRule(
      ruleBindDeclaration,
      createAltRule(createConsTokenRule('opAssign')),
      ruleAssignExpr,
    ),
    ruleBindDeclaration,
  )(tokens)
  return (
    res && [
      res[0],
      res[1] instanceof Array
        ? {
            type: (() => {
              switch (res[1][1]) {
                case 'opAssign':
                  return 'assign'
              }
            })(),
            left: res[1][0],
            right: res[1][2],
          }
        : res[1],
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleBindDeclaration(tokens) {
  const res = createAltRule(
    createSeqRule(
      createConsTokenRule('keywordLet'),
      createOptRule(createConsTokenRule('keywordMut')),
      ruleBindDeclaration,
    ),
    createSeqRule(ruleOrExpr),
  )(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 3: {
            return {
              type: 'bindDeclaration',
              bind: res[1][2],
              mutable: res[1][1] ? true : undefined,
            }
          }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleOrExpr(tokens) {
  const res = createAltRule(
    createSeqRule(ruleAndExpr, createConsTokenRule('opOr'), ruleOrExpr),
    createSeqRule(ruleAndExpr),
  )(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 3:
            return {
              type: 'or',
              left: res[1][0],
              right: res[1][2],
            }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleAndExpr(tokens) {
  const res = createAltRule(
    createSeqRule(ruleEqExpr, createConsTokenRule('opAnd'), ruleAndExpr),
    createSeqRule(ruleEqExpr),
  )(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 3:
            return {
              type: 'and',
              left: res[1][0],
              right: res[1][2],
            }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleEqExpr(tokens) {
  const res = createAltRule(
    createSeqRule(ruleGtExpr, createConsTokenRule('opEq'), ruleEqExpr),
    createSeqRule(ruleGtExpr, createConsTokenRule('opNe'), ruleEqExpr),
    createSeqRule(ruleGtExpr),
  )(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 3:
            return {
              type: (() => {
                switch (res[1][1]) {
                  case 'opEq':
                    return 'eq'
                  case 'opNe':
                    return 'ne'
                }
              })(),
              left: res[1][0],
              right: res[1][2],
            }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

const ruleGtExprInternal = createAltRule(
  createSeqRule(ruleAddExpr, createConsTokenRule('opGt'), ruleGtExpr),
  createSeqRule(ruleAddExpr, createConsTokenRule('opGe'), ruleGtExpr),
  createSeqRule(ruleAddExpr, createConsTokenRule('opLt'), ruleGtExpr),
  createSeqRule(ruleAddExpr, createConsTokenRule('opLe'), ruleGtExpr),
  createSeqRule(ruleAddExpr),
)
/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleGtExpr(tokens) {
  const res = ruleGtExprInternal(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 3:
            return {
              type: (() => {
                switch (res[1][1]) {
                  case 'opGt':
                    return 'gt'
                  case 'opGe':
                    return 'ge'
                  case 'opLt':
                    return 'lt'
                  case 'opLe':
                    return 'le'
                }
              })(),
              left: res[1][0],
              right: res[1][2],
            }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleAddExpr(tokens) {
  const res = createAltRule(
    createSeqRule(
      ruleMulExpr,
      createAltRule(createConsTokenRule('opAdd'), createConsTokenRule('opSub')),
      ruleAddExpr,
    ),
    ruleMulExpr,
  )(tokens)
  return (
    res && [
      res[0],
      res[1] instanceof Array
        ? {
            type: (() => {
              switch (res[1][1]) {
                case 'opAdd':
                  return 'add'
                case 'opSub':
                  return 'sub'
              }
            })(),
            left: res[1][0],
            right: res[1][2],
          }
        : res[1],
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleMulExpr(tokens) {
  const res = createAltRule(
    createSeqRule(
      ruleNegExpr,
      createAltRule(
        createConsTokenRule('opMul'),
        createConsTokenRule('opDiv'),
        createConsTokenRule('opMod'),
      ),
      ruleMulExpr,
    ),
    ruleNegExpr,
  )(tokens)
  return (
    res && [
      res[0],
      res[1] instanceof Array
        ? {
            type: (() => {
              switch (res[1][1]) {
                case 'opMul':
                  return 'mul'
                case 'opDiv':
                  return 'div'
                case 'opMod':
                  return 'mod'
              }
            })(),
            left: res[1][0],
            right: res[1][2],
          }
        : res[1],
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleNegExpr(tokens) {
  const res = createAltRule(
    createSeqRule(createConsTokenRule('opSub'), ruleNegExpr),
    createSeqRule(createConsTokenRule('puncBang'), ruleNegExpr),
    createSeqRule(ruleIndexExpr),
  )(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 2: {
            switch (res[1][0]) {
              case 'opSub':
                return {
                  type: 'neg',
                  expr: res[1][1],
                }
              case 'puncBang':
                return {
                  type: 'not',
                  expr: res[1][1],
                }
            }
          }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

const ruleIndexExprInternal = createAltRule(
  createSeqRule(
    ruleParrenExpr,
    createConsTokenRule('puncBracketLeft'),
    ruleIndexExpr,
    createConsTokenRule('puncBracketRight'),
  ),
  createSeqRule(
    ruleParrenExpr,
    createConsTokenRule('puncParrenLeft'),
    ruleTupleExpr,
    createConsTokenRule('puncParrenRight'),
  ),
  createSeqRule(ruleParrenExpr, createConsTokenRule('puncDot'), ruleIndexExpr),
  createSeqRule(ruleParrenExpr),
)
/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleIndexExpr(tokens) {
  const res = ruleIndexExprInternal(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 4: {
            switch (res[1][1]) {
              case 'puncBracketLeft':
                return {
                  type: 'index',
                  arr: res[1][0],
                  index: res[1][2],
                }
              case 'puncParrenLeft':
                return {
                  type: 'call',
                  fn: res[1][0],
                  params: res[1][2].exprs || [res[1][2]],
                }
            }
          }
          case 3:
            return {
              type: 'member',
              obj: res[1][0],
              member: res[1][2],
            }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleParrenExpr(tokens) {
  const res = createAltRule(
    createSeqRule(
      createConsTokenRule('puncParrenLeft'),
      ruleExpr,
      createConsTokenRule('puncParrenRight'),
    ),
    createSeqRule(ruleTermExpr),
  )(tokens)
  return (
    res && [
      res[0],
      (() => {
        switch (res[1].length) {
          case 3:
            return {
              type: 'parren',
              expr: res[1][1],
            }
          case 1:
            return res[1][0]
        }
      })(),
    ]
  )
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleTermExpr(tokens) {
  let res
  res = ruleLiteralExpr(tokens)
  if (res) {
    return [res[0], res[1]]
  }
  res = ruleIdentifierExpr(tokens)
  if (res) {
    return [res[0], res[1]]
  }
  return null
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeIdentifier]?}
 */
function ruleIdentifierExpr(tokens) {
  if (tokens.length > 0) {
    switch (tokens[0].type) {
      case 'identifier':
        return [
          tokens.slice(1),
          {
            type: 'identifier',
            content: tokens[0].content,
          },
        ]
      default:
        return null
    }
  } else {
    throw new ParseError('unexpected eof')
  }
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleLiteralExpr(tokens) {
  const res = createAltRule(ruleLiteralNumber, ruleLiteralString)(tokens)
  return res && [res[0], res[1]]
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleLiteralString(tokens) {
  if (tokens.length <= 0) {
    throw new ParseError('unexpected eof')
  }
  switch (tokens[0].type) {
    case 'literalString':
      return [
        tokens.slice(1),
        {
          type: 'literalString',
          content: tokens[0].content
            .replace(/^("|')/, '')
            .replace(/("|')$/, '')
            .replaceAll('\\\\', '\\')
            .replaceAll(/\\"/g, '"')
            .replaceAll(/\\'/g, "'"),
        },
      ]
    default:
      return null
  }
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeLiteralInt | import("./types").NodeLiteralFloat]?}
 */
function ruleLiteralNumber(tokens) {
  if (tokens.length > 0) {
    switch (tokens[0].type) {
      case 'literalInt':
        return [
          tokens.slice(1),
          {
            type: 'literalInt',
            content: tokens[0].content,
          },
        ]
      case 'literalFloat':
        return [
          tokens.slice(1),
          {
            type: 'literalFloat',
            content: tokens[0].content,
          },
        ]
      default:
        return null
    }
  } else {
    throw new ParseError('unexpected eof')
  }
}

/**
 * 解析
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {import("./types").NodeUnknown[]?}
 */
export function parse(tokens) {
  return ruleStatements(tokens)?.[1]
}
