export class RustedScriptCompileError extends Error {}

/** @type {(expr: import("./types").NodeUnknown) => string} */
function compileComputeExpr(expr) {
  switch (expr.type) {
    default:
      throw new RustedScriptCompileError('unsupported syntaxes')
    case 'identifier':
      return `memory.${expr.content}`
    case 'literalInt':
    case 'literalFloat':
      return expr.content
    case 'literalBool':
      return `${expr.val}`
    case 'parren':
      return `(${compileComputeExpr(expr.expr)})`
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'mod':
      return `${compileComputeExpr(expr.left)}${(() => {
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
      })()}${compileComputeExpr(expr.right)}`
  }
}

/** @type {(stmt: import("./types").NodeUnknown) => import("./types").RWASMInstruction[]} */
function compileStatement(stmt) {
  switch (stmt.type) {
    default:
      throw new RustedScriptCompileError('unsupported syntaxes')
    case 'assign':
      switch (stmt.left.type) {
        default:
          throw new RustedScriptCompileError('unsupported syntaxes')
        case 'identifier':
          return [
            {
              type: 'setmem',
              sets: [[stmt.left.content, compileComputeExpr(stmt.right)]],
            },
          ]
      }
  }
}

/** @type {(nodes: import("./types").NodeUnknown[]) => import("./types").RWASM} */
export function compile(nodes) {
  return nodes
    .map(node => {
      switch (node.type) {
        default:
          throw new RustedScriptCompileError('unsupported syntaxes')
        case 'functionDeclaration':
          return {
            type: 'action',
            name: node.identifier.content,
            instructions: node.block.statements
              .map(compileStatement)
              .reduce((p, c) => [...p, ...c], []),
          }
        case 'bindDeclaration':
          return {
            type: 'memdef',
            name: (() => {
              switch (node.bind.type) {
                default:
                  throw new RustedScriptCompileError('unsupported syntaxes')
                case 'identifier':
                  return node.bind.content
              }
            })(),
            typ: (() => {
              if (node.anno && node.anno.length > 0) {
                const anno = node.anno.find(anno => anno.id.content === 'type')
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
            })(),
          }
      }
    })
    .filter(x => x)
    .reduce(
      (asm, c) => {
        return (() => {
          switch (c.type) {
            default:
              throw new Error('unreachable!')
            case 'memdef':
              return {
                ...asm,
                memories: {
                  ...asm.memories,
                  [c.name]: c.typ,
                },
              }
            case 'action':
              return {
                ...asm,
                actions: [
                  ...asm.actions,
                  {
                    name: c.name,
                    instructions: c.instructions,
                  },
                ],
              }
          }
        })()
      },
      {
        memories: {},
        externalMemories: {},
        externalActions: [],
        actions: [],
      },
    )
}
