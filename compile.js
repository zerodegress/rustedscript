export class RustedScriptCompileError extends Error {}

/** @type {(expr: import("./types").NodeUnknown, ctx: import("./types").RWASMCompileContext) => string} */
function compileComputeExpr(expr, ctx) {
  switch (expr.type) {
    default:
      throw new RustedScriptCompileError('unsupported syntaxes')
    case 'identifier':
      return ctx.idMap[expr.content]
    case 'literalInt':
    case 'literalFloat':
      return expr.content
    case 'literalBool':
      return `${expr.val}`
    case 'parren':
      return `(${compileComputeExpr(expr.expr, ctx)})`
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'mod':
      return `${compileComputeExpr(expr.left, ctx)}${(() => {
        switch (expr.type) {
          case 'add':
            return '+'
          case 'sub':
            return '-'
          case 'mul':
            return '*'
          case 'div':
            return '/'
          case 'mod':
            return '%'
        }
      })()}${compileComputeExpr(expr.right, ctx)}`
  }
}

/** @type {(stmt: import("./types").NodeUnknown, ctx: import("./types").RWASMCompileContext) => [import("./types").RWASMInstruction[], import("./types").RWASMCompileContext]} */
function compileStatement(stmt, ctx) {
  switch (stmt.type) {
    default:
      throw new RustedScriptCompileError('unsupported syntaxes')
    case 'assign':
      switch (stmt.left.type) {
        default:
          throw new RustedScriptCompileError('unsupported syntaxes')
        case 'identifier':
          return [
            [
              {
                type: 'setmem',
                sets: [
                  [stmt.left.content, compileComputeExpr(stmt.right, ctx)],
                ],
              },
            ],
            ctx,
          ]
      }
  }
}

/** @type {(nodes: import("./types").NodeUnknown[]) => import("./types").RWASM} */
export function compile(nodes) {
  /** @type {[import("./types").RWASM, import("./types").RWASMCompileContext]} */
  const init = [
    {
      memories: {},
      externalMemories: {},
      externalActions: [],
      actions: [],
    },
    {
      scope: '',
      idMap: {},
    },
  ]
  const [asm] = nodes.reduce(([asm, ctx], node) => {
    switch (node.type) {
      default:
        throw new RustedScriptCompileError('unsupported syntaxes')
      case 'functionDeclaration': {
        const name = node.identifier.content
        /** @type {[import("./types").RWASMInstruction[], import("./types").RWASMCompileContext]} */
        const init = [
          [],
          {
            ...ctx,
            scope: `rwaction_${name}`,
          },
        ]
        const [instructions] = node.block.statements.reduce(
          ([insts, ctx], stmt) => {
            const [nInsts, nCtx] = compileStatement(stmt, ctx)
            return [[...insts, ...nInsts], nCtx]
          },
          init,
        )
        return [
          {
            ...asm,
            actions: [
              ...asm.actions,
              {
                name,
                instructions,
              },
            ],
          },
          {
            ...ctx,
            idMap: {
              ...ctx.idMap,
              [name]: name,
            },
          },
        ]
      }
      case 'bindDeclaration': {
        switch (node.bind.type) {
          default:
            throw new RustedScriptCompileError('unsupported syntaxes')
          case 'identifier': {
            const name = node.bind.content
            const typ = (() => {
              if (node.anno && node.anno.length > 0) {
                /** @type {import("./types").NodeAnnotation?} */
                const anno = node.anno.find(anno => anno.id.content === 'type')
                if (!anno || anno.params.length <= 0) {
                  throw new RustedScriptCompileError('unsupported syntaxes')
                }
                const param = anno.params[0]
                switch (param.type) {
                  default:
                    throw new RustedScriptCompileError('unsupported syntaxes')
                  case 'literalString':
                    return param.content
                }
              } else {
                throw new RustedScriptCompileError('unsupported syntaxes')
              }
            })()
            return [
              {
                ...asm,
                memories: {
                  ...asm.memories,
                  [name]: typ,
                },
              },
              {
                ...ctx,
                idMap: {
                  ...ctx.idMap,
                  [name]: `memory.${name}`,
                },
              },
            ]
          }
        }
      }
    }
  }, init)
  return asm
}
