export class IgnorableParseError extends Error {}
export class ParseError extends Error {}

/**
 *
 * @param {string} msg
 * @returns {() => never}
 */
function createErrorRule(msg) {
  return () => {
    throw new ParseError(msg)
  }
}

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

/** @type {import("./types").Parser} */
const __ruleStatement = createTransRule(
  createSeqRule(ruleExpr, createOptRule(createConsTokenRule('puncSemi'))),
  ([expr]) => expr,
)
/** @type {import("./types").Parser} */
function ruleStatement(tokens) {
  return __ruleStatement(tokens)
}

/** @type {import("./types").Parser} */
const __ruleStatements = createAltRule(
  createTransRule(
    createSeqRule(ruleStatement, ruleStatements),
    ([stmt, stmts]) => [stmt, ...stmts],
  ),
  createSeqRule(ruleStatement),
)
/** @type {import("./types").Parser<import("./types").NodeUnknown[]>} */
function ruleStatements(tokens) {
  return __ruleStatements(tokens)
}

/** @type {import("./types").Parser} */
const __ruleBlock = createTransRule(
  createSeqRule(
    createConsTokenRule('puncBraceLeft'),
    createOptRule(ruleStatements),
    createAltRule(
      createConsTokenRule('puncBraceRight'),
      createErrorRule('unclosed "{"'),
    ),
  ),
  ([, stmts]) => ({
    type: 'block',
    statements: stmts || [],
  }),
)
/** @type {import("./types").Parser} */
function ruleBlock(tokens) {
  return __ruleBlock(tokens)
}

/** @type {import("./types").Parser} */
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
        createErrorRule('unclosed "("'),
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
/** @type {import("./types").Parser} */
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

/** @type {import("./types").Parser} */
const __ruleFunctionDeclaration = createTransRule(
  createSeqRule(
    createConsTokenRule('keywordFn'),
    createAltRule(
      createTransRule(
        createSeqRule(
          ruleIdentifierExpr,
          createConsTokenRule('puncParrenLeft'),
          createOptRule(ruleTupleExpr),
          createAltRule(
            createConsTokenRule('puncParrenRight'),
            createErrorRule('unclosed "("'),
          ),
          ruleBlock,
        ),
        ([identifier, , tuple, , block]) => ({
          type: 'functionDeclaration',
          identifier,
          params: tuple ? (tuple.type === 'tuple' ? tuple.exprs : [tuple]) : [],
          block,
        }),
      ),
      createErrorRule('expected identifier'),
    ),
  ),
  ([, fn]) => fn,
)
/** @type {import("./types").Parser} */
function ruleFunctionDeclaration(tokens) {
  return __ruleFunctionDeclaration(tokens)
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
        createTransRule('unclosed "["'),
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
        createErrorRule('unclosed "("'),
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
        createErrorRule('unclosed "("'),
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
    createAltRule(ruleExpr, createErrorRule('expected expression')),
    ruleBlock,
    createOptRule(
      createTransRule(
        createSeqRule(
          createCapTokenRule('keywordElse'),
          createAltRule(
            ruleIfExpr,
            ruleBlock,
            createErrorRule('expected "if" or block'),
          ),
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
