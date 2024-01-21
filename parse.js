export class IgnorableParseError extends Error {}
export class ParseError extends Error {}

/**
 * @param {import("./types").TokenUnknown['type']} type
 */
function createCapTokenRule(type) {
  return tokens => {
    if (tokens.length <= 0) {
      throw new IgnorableParseError('unexpected eof')
    }
    switch (tokens[0].type) {
      default:
        return null
      case type:
        return [tokens.slice(1), tokens[0]]
    }
  }
}

function createTransRule(rule, transform) {
  return tokens => {
    if (tokens.length <= 0) {
      throw new IgnorableParseError('unexpected eof')
    }
    const res = rule(tokens)
    if (!res) {
      return null
    }
    return [res[0], transform(res[1])]
  }
}

function createOptRule(rule) {
  return tokens => {
    if (tokens.length <= 0) {
      return [tokens, null]
    }
    let res
    try {
      res = rule(tokens)
    } catch (e) {
      if (e instanceof IgnorableParseError) {
        return [tokens, null]
      } else {
        throw e
      }
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
      throw new IgnorableParseError('unexpected eof')
    }
    for (const rule of rules) {
      let res
      try {
        res = rule(tokens)
      } catch (e) {
        if (e instanceof IgnorableParseError) {
          continue
        } else {
          throw e
        }
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
        if (!(e instanceof IgnorableParseError)) {
          throw e
        }
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
  return createTransRule(createCapTokenRule(type), token => token.type)
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown]?}
 */
function ruleStatement(tokens) {
  const res = createSeqRule(
    ruleExpr,
    createOptRule(createConsTokenRule('puncSemi')),
  )(tokens)
  return res && [res[0], res[1][0]]
}

const __ruleStatements = createAltRule(
  createTransRule(
    createSeqRule(ruleStatement, ruleStatements),
    ([stmt, stmts]) => [stmt, ...stmts],
  ),
  createSeqRule(ruleStatement),
)
/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeUnknown[]]?}
 */
function ruleStatements(tokens) {
  return __ruleStatements(tokens)
}

/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeBlock]?}
 */
function ruleBlock(tokens) {
  const res = createSeqRule(
    createConsTokenRule('puncBraceLeft'),
    createOptRule(ruleStatements),
    createAltRule(
      createConsTokenRule('puncBraceRight'),
      createTransRule(createSeqRule(), () => {
        throw new ParseError('unclosed "{"')
      }),
    ),
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

const __ruleAnnotation = createAltRule(
  createTransRule(
    createSeqRule(
      createCapTokenRule('puncAt'),
      ruleIdentifierExpr,
      createCapTokenRule('puncParrenLeft'),
      createTransRule(
        createOptRule(
          createTransRule(ruleTupleExpr, tuple => {
            switch (tuple.type) {
              default:
                return [tuple]
              case 'tuple':
                return tuple.exprs
            }
          }),
        ),
        x => x || [],
      ),
      createAltRule(
        createCapTokenRule('puncParrenRight'),
        createTransRule(createSeqRule(), () => {
          throw new ParseError('unclosed "("')
        }),
      ),
    ),
    ([, id, , params]) => ({
      type: 'annotation',
      id,
      params,
    }),
  ),
  createTransRule(
    createSeqRule(createCapTokenRule('puncAt'), ruleIdentifierExpr),
    ([, id]) => ({
      type: 'annotation',
      id,
      params: [],
    }),
  ),
)
/**
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {[import("./types").TokenUnknown[], import("./types").NodeAnnotation]?}
 */
function ruleAnnotation(tokens) {
  return __ruleAnnotation(tokens)
}

/** @type {import("./types").Parser<import("./types").NodeAnnotation[]>} */
const __ruleAnnotations = createAltRule(
  createTransRule(
    createSeqRule(ruleAnnotation, ruleAnnotations),
    ([anno, annos]) => [anno, ...annos],
  ),
  createSeqRule(ruleAnnotation),
)
/** @type {import("./types").Parser<import("./types").NodeAnnotation[]>} */
function ruleAnnotations(tokens) {
  return __ruleAnnotations(tokens)
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
    createAltRule(
      createConsTokenRule('puncParrenRight'),
      createTransRule(createSeqRule(), () => {
        throw new ParseError('unclosed "("')
      }),
    ),
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

/** @type {import("./types").Parser} */
const __ruleExpr = createAltRule(ruleStatementExpr, ruleComputeExpr)
/** @type {import("./types").Parser} */
function ruleExpr(tokens) {
  return __ruleExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleStatementExpr = createTransRule(
  createSeqRule(
    createOptRule(ruleAnnotations),
    createAltRule(
      ruleBlock,
      ruleIfExpr,
      ruleFunctionDeclaration,
      ruleBindDeclarationExpr,
    ),
  ),
  ([anno, stmt]) => ({
    ...stmt,
    anno: anno || undefined,
  }),
)
/** @type {import("./types").Parser} */
function ruleStatementExpr(tokens) {
  return __ruleStatementExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleComputeExpr = createAltRule(ruleTupleExpr)
/** @type {import("./types").Parser} */
function ruleComputeExpr(tokens) {
  return __ruleComputeExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleBindDeclarationExpr = createTransRule(
  createSeqRule(
    createConsTokenRule('keywordLet'),
    createTransRule(createOptRule(createConsTokenRule('keywordMut')), mut =>
      mut ? true : undefined,
    ),
    ruleTupleExpr,
  ),
  ([, mutable, bind]) => ({
    type: 'bindDeclaration',
    bind,
    mutable,
  }),
)
/** @type {import("./types").Parser} */
function ruleBindDeclarationExpr(tokens) {
  return __ruleBindDeclarationExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleTupleExpr = createAltRule(
  createTransRule(
    createSeqRule(
      ruleAnnotationExpr,
      createCapTokenRule('puncComma'),
      ruleTupleExpr,
    ),
    ([expr, , tuple]) => ({
      type: 'tuple',
      exprs: [expr, ...(tuple?.exprs || [])],
    }),
  ),
  createTransRule(
    createSeqRule(ruleAnnotationExpr, createCapTokenRule('puncComma')),
    ([expr]) => ({
      type: 'tuple',
      exprs: [expr],
    }),
  ),
  ruleAnnotationExpr,
)
/** @type {import("./types").Parser} */
function ruleTupleExpr(tokens) {
  return __ruleTupleExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleAnnotationExpr = createAltRule(
  createTransRule(
    createSeqRule(ruleAnnotation, ruleAnnotationExpr),
    ([anno, expr]) => ({
      ...expr,
      anno: [anno, ...(expr?.anno || [])],
    }),
  ),
  ruleAssignExpr,
)
/** @type {import("./types").Parser} */
function ruleAnnotationExpr(tokens) {
  return __ruleAnnotationExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleAssignExpr = createAltRule(
  createTransRule(
    createSeqRule(
      ruleOrExpr,
      createAltRule(
        createTransRule(createCapTokenRule('opAssign'), () => 'assign'),
      ),
      ruleAssignExpr,
    ),
    ([left, type, right]) => ({
      type,
      left,
      right,
    }),
  ),
  ruleOrExpr,
)
/** @type {import("./types").Parser} */
function ruleAssignExpr(tokens) {
  return __ruleAssignExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleOrExpr = createAltRule(
  createTransRule(
    createSeqRule(ruleAndExpr, createCapTokenRule('opOr'), ruleOrExpr),
    ([left, , right]) => ({
      type: 'or',
      left,
      right,
    }),
  ),
  ruleAndExpr,
)
/** @type {import("./types").Parser} */
function ruleOrExpr(tokens) {
  return __ruleOrExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleAndExpr = createAltRule(
  createTransRule(
    createSeqRule(ruleEqExpr, createCapTokenRule('opAnd'), ruleAndExpr),
    ([left, , right]) => ({
      type: 'and',
      left,
      right,
    }),
  ),
  ruleEqExpr,
)
/** @type {import("./types").Parser} */
function ruleAndExpr(tokens) {
  return __ruleAndExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleEqExpr = createAltRule(
  createTransRule(
    createSeqRule(
      ruleGtExpr,
      createAltRule(
        createTransRule(createCapTokenRule('opEq'), () => 'eq'),
        createTransRule(createCapTokenRule('opNe'), () => 'ne'),
      ),
      ruleEqExpr,
    ),
    ([left, type, right]) => ({
      type,
      left,
      right,
    }),
  ),
  ruleGtExpr,
)
/** @type {import("./types").Parser} */
function ruleEqExpr(tokens) {
  return __ruleEqExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleGtExpr = createAltRule(
  createTransRule(
    createSeqRule(
      ruleAddExpr,
      createAltRule(
        createTransRule(createCapTokenRule('opGt'), () => 'gt'),
        createTransRule(createCapTokenRule('opGe'), () => 'ge'),
        createTransRule(createCapTokenRule('opLt'), () => 'lt'),
        createTransRule(createCapTokenRule('opLe'), () => 'le'),
      ),
      ruleGtExpr,
    ),
    ([left, type, right]) => ({
      type,
      left,
      right,
    }),
  ),
  ruleAddExpr,
)
/** @type {import("./types").Parser} */
function ruleGtExpr(tokens) {
  return __ruleGtExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleAddExpr = createAltRule(
  createTransRule(
    createSeqRule(
      ruleMulExpr,
      createAltRule(
        createTransRule(createConsTokenRule('opAdd'), () => 'add'),
        createTransRule(createConsTokenRule('opSub'), () => 'sub'),
      ),
      ruleAddExpr,
    ),
    ([left, type, right]) => ({
      type,
      left,
      right,
    }),
  ),
  ruleMulExpr,
)
/** @type {import("./types").Parser} */
function ruleAddExpr(tokens) {
  return __ruleAddExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleMulExpr = createAltRule(
  createTransRule(
    createSeqRule(
      ruleNegExpr,
      createAltRule(
        createTransRule(createCapTokenRule('opMul'), () => 'mul'),
        createTransRule(createCapTokenRule('opDiv'), () => 'div'),
        createTransRule(createCapTokenRule('opMod'), () => 'mod'),
      ),
      ruleMulExpr,
    ),
    ([left, type, right]) => ({
      type,
      left,
      right,
    }),
  ),
  ruleNegExpr,
)
/** @type {import("./types").Parser} */
function ruleMulExpr(tokens) {
  return __ruleMulExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleNegExpr = createAltRule(
  createTransRule(
    createSeqRule(createConsTokenRule('opSub'), ruleNegExpr),
    ([, expr]) => ({
      type: 'neg',
      expr,
    }),
  ),
  createTransRule(
    createSeqRule(createConsTokenRule('puncBang'), ruleNegExpr),
    ([, expr]) => ({
      type: 'not',
      expr,
    }),
  ),
  ruleIndexExpr,
)
/** @type {import("./types").Parser} */
function ruleNegExpr(tokens) {
  return __ruleNegExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleIndexExpr = createAltRule(
  createTransRule(
    createSeqRule(
      ruleParrenExpr,
      createConsTokenRule('puncBracketLeft'),
      ruleTupleExpr,
      createAltRule(
        createConsTokenRule('puncBracketRight'),
        createTransRule(createSeqRule(), () => {
          throw new ParseError('unclosed "["')
        }),
      ),
    ),
    ([arr, , index]) => ({
      type: 'index',
      arr,
      index,
    }),
  ),
  createTransRule(
    createSeqRule(
      ruleParrenExpr,
      createConsTokenRule('puncParrenLeft'),
      createTransRule(ruleTupleExpr, tuple =>
        (() => {
          switch (tuple.type) {
            case 'tuple':
              return [...tuple.exprs]
            default:
              return [tuple]
          }
        })(),
      ),
      createAltRule(
        createConsTokenRule('puncParrenRight'),
        createTransRule(createSeqRule(), () => {
          throw new ParseError('unclosed "("')
        }),
      ),
    ),
    ([fn, , params]) => ({
      type: 'call',
      fn,
      params,
    }),
  ),
  createTransRule(
    createSeqRule(
      ruleParrenExpr,
      createConsTokenRule('puncDot'),
      ruleIndexExpr,
    ),
    ([obj, , member]) => ({
      type: 'member',
      obj,
      member,
    }),
  ),
  ruleParrenExpr,
)
/** @type {import("./types").Parser} */
function ruleIndexExpr(tokens) {
  return __ruleIndexExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleParrenExpr = createAltRule(
  createTransRule(
    createSeqRule(
      createConsTokenRule('puncParrenLeft'),
      ruleExpr,
      createAltRule(
        createConsTokenRule('puncParrenRight'),
        createTransRule(createSeqRule(), () => {
          throw new ParseError('unclosed "("')
        }),
      ),
    ),
    ([, expr]) => ({
      type: 'parren',
      expr,
    }),
  ),
  ruleBlock,
  ruleIfExpr,
  ruleTermExpr,
)
/** @type {import("./types").Parser} */
function ruleParrenExpr(tokens) {
  return __ruleParrenExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleIfExpr = createTransRule(
  createSeqRule(
    createCapTokenRule('keywordIf'),
    ruleExpr,
    ruleBlock,
    createOptRule(
      createTransRule(
        createSeqRule(
          createCapTokenRule('keywordElse'),
          createAltRule(ruleIfExpr, ruleBlock),
        ),
        ([, elseThen]) => elseThen,
      ),
    ),
  ),
  ([, cond, then, elseThen]) => ({
    type: 'if',
    cond,
    then,
    elseThen: elseThen || undefined,
  }),
)
/** @type {import("./types").Parser} */
function ruleIfExpr(tokens) {
  return __ruleIfExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleTermExpr = createAltRule(ruleLiteralExpr, ruleIdentifierExpr)
/** @type {import("./types").Parser} */
function ruleTermExpr(tokens) {
  return __ruleTermExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleIdentifierExpr = createTransRule(
  createCapTokenRule('identifier'),
  token => ({
    type: 'identifier',
    content: token.content,
  }),
)
/** @type {import("./types").Parser} */
function ruleIdentifierExpr(tokens) {
  return __ruleIdentifierExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleLiteralExpr = createAltRule(
  ruleLiteralBool,
  ruleLiteralNumber,
  ruleLiteralString,
)
/** @type {import("./types").Parser} */
function ruleLiteralExpr(tokens) {
  return __ruleLiteralExpr(tokens)
}

/** @type {import("./types").Parser} */
const __ruleLiteralBool = createTransRule(
  createCapTokenRule('literalBool'),
  token => ({
    type: 'literalBool',
    val: token.content === 'true',
  }),
)
/** @type {import("./types").Parser} */
function ruleLiteralBool(tokens) {
  return __ruleLiteralBool(tokens)
}

/** @type {import("./types").Parser} */
const __ruleLiteralString = createTransRule(
  createCapTokenRule('literalString'),
  token => ({
    type: 'literalString',
    content: token.content
      .replaceAll(/(^("|'))|(("|')$)/g, '')
      .replaceAll('\\\\', '\\')
      .replaceAll(/\\"/g, '"')
      .replaceAll(/\\'/g, "'"),
  }),
)
/** @type {import("./types").Parser} */
function ruleLiteralString(tokens) {
  return __ruleLiteralString(tokens)
}

/** @type {import("./types").Parser} */
const __ruleLiteralNumber = createAltRule(
  createTransRule(createCapTokenRule('literalInt'), token => ({
    type: 'literalInt',
    content: token.content,
  })),
  createTransRule(createCapTokenRule('literalFloat'), token => ({
    type: 'literalFloat',
    content: token.content,
  })),
)
/** @type {import("./types").Parser} */
function ruleLiteralNumber(tokens) {
  return __ruleLiteralNumber(tokens)
}

/**
 * 解析
 * @param {import("./types").TokenUnknown[]} tokens
 * @returns {import("./types").NodeUnknown[]}
 */
export function parse(tokens) {
  const res = tokens.length > 0 ? ruleStatements(tokens)?.[1] : []
  if (res) {
    return res
  } else {
    throw ParseError('not valid rustedscript')
  }
}
