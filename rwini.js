export class RwiniCompileError extends Error {}

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
          const secName = `hiddenAction_${statement.identifier.identifier}`
          const props = statement.block.statements
            .map(statement => {
              switch (statement.type) {
                case 'assign': {
                  switch (statement.left.type) {
                    case 'identifier': {
                      const leftId = statement.left.identifier
                      switch (statement.right.type) {
                        case 'identifier': {
                          const rightId = statement.right.identifier
                          return [
                            'setUnitMemory',
                            `${leftId}=memory.${rightId}`,
                          ]
                        }
                        default: {
                          throw new RwiniCompileError('unsupported syntaxes')
                        }
                      }
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
          throw RwiniCompileError('unsupported syntaxes')
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
