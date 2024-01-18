export class RwiniCompileError extends Error {}

/**
 * @param {import('./types').NodeUnknown} node
 * @returns {string}
 */
function compileFunctionParamExpr(node) {
  switch (node.type) {
    case 'assign': {
      switch (node.left.type) {
        case 'identifier':
          return `${node.left.content}=${compileComputeExpr(node.right)}`
        default:
          throw new RwiniCompileError('unsupported syntaxes')
      }
    }
    default:
      return compileComputeExpr(node)
  }
}

/**
 * @param {import('./types').NodeUnknown} node
 * @returns {string}
 */
function compileFunctionNameExpr(node) {
  switch (node.type) {
    case 'identifier':
      return node.content
    default:
      throw new RwiniCompileError('unsupported syntaxes')
  }
}

/**
 * @param {import('./types').NodeUnknown} node
 * @returns {string}
 */
function compileComputeExpr(node) {
  switch (node.type) {
    case 'identifier':
      return `memory.${node.content}`
    case 'literalInt':
    case 'literalFloat':
      return node.content
    case 'literalString':
      return `'${node.content.replaceAll(/'/g, "'")}'`
    case 'parren':
      return `(${compileComputeExpr(node.expr)})`
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'mod':
    case 'and':
    case 'or': {
      return `${compileComputeExpr(node.left)}${(() => {
        switch (node.type) {
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
          case 'and':
            return ' and '
          case 'or':
            return ' or '
        }
      })()}${compileComputeExpr(node.right)}`
    }
    case 'neg':
    case 'not':
      return `${(() => {
        switch (node.type) {
          case 'neg':
            return '-'
          case 'not':
            return ' not '
        }
      })()}${compileComputeExpr(node.expr)}`
    case 'call':
      return `${compileFunctionNameExpr(node.fn)}(${node.params.map(compileFunctionParamExpr).join(',')})`
    case 'index':
      return `${compileComputeExpr(node.arr)}[${compileComputeExpr(node.index)}]`
    default:
      throw new RwiniCompileError('unsupported syntaxes')
  }
}

/**
 * 编译
 * @param {import('./types').NodeUnknown[]} src
 * @returns {import('./types').RwIni}
 */
export function compile(src) {
  const statements = src
  const rwini = statements
    .map(statement => {
      switch (statement.type) {
        case 'functionDeclaration': {
          const secName = `hiddenAction_${statement.identifier.content}`
          const props = statement.block.statements
            .map(statement => {
              switch (statement.type) {
                case 'assign': {
                  switch (statement.left.type) {
                    case 'identifier': {
                      const leftId = statement.left.content
                      return [
                        'setUnitMemory',
                        `${leftId}=${compileComputeExpr(statement.right)}`,
                      ]
                    }
                    default: {
                      throw new RwiniCompileError('unsupported syntaxes')
                    }
                  }
                }
                default:
                  throw new RwiniCompileError('unsupported syntaxes')
              }
            })
            .reduce((sec, [k, v]) => {
              if (k in sec) {
                switch (k) {
                  case 'setUnitMemory': {
                    return {
                      ...sec,
                      [k]: sec[k] + ',' + v,
                    }
                  }
                  default: {
                    return {
                      ...sec,
                      [k]: v,
                    }
                  }
                }
              } else {
                return {
                  ...sec,
                  [k]: v,
                }
              }
            }, {})
          return [secName, props]
        }
        default:
          throw new RwiniCompileError('unsupported syntaxes')
      }
    })
    .reduce((ini, [secName, props]) => {
      if (secName in ini) {
        switch (secName) {
          case 'core':
            return {
              ...ini,
              [secName]: {
                ...ini[secName],
                ...props,
              },
            }
          default:
            return {
              ...ini,
              [secName]: props,
            }
        }
      } else {
        return {
          ...ini,
          [secName]: props,
        }
      }
    }, {})
  return rwini
}
