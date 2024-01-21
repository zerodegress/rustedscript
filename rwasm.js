/** @type {(asm: import("./types").RWASMInstruction, action: string, index: number) => [string, string][]} */
function compileInstruction(inst, action, index) {
  switch (inst.type) {
    case 'setmem':
      return [
        [
          'setUnitMemory',
          inst.sets.map(([k, v]) => `${k}=${v}`).reduce((p, c) => `${p},${c}`),
        ],
      ]
    case 'forkjump':
      return [
        [
          'alsoTriggerAction',
          inst.tos.map(to => `rwasmaction_${action}_${index + to}`).join(','),
        ],
      ]
    case 'cond':
      return [['alsoTriggerOrQueueActionConditional', inst.cond]]
    case 'nop':
      return []
  }
}

/** @type {(asm: import("./types").RWASM) => import("./types").RWIni} */
export function compile(asm) {
  return {
    sections: [
      {
        name: 'core',
        props: [
          ...Object.entries(asm.memories).map(([mem, typ]) => [
            `@memory ${mem}`,
            typ,
          ]),
        ],
      },
      ...asm.actions
        .map(({ name, instructions }, index) => [
          {
            name: `hiddenAction_${name}`,
            props: [
              ['buildSpeed', '0'],
              instructions.length > 1 && [
                'alsoTriggerAction',
                `rwasmaction_${name}_0`,
              ],
              ...(instructions.length > 0
                ? compileInstruction(instructions[0], name, index)
                : []),
            ].filter(x => x),
          },
          ...instructions.slice(1).map((inst, index, instructions) => ({
            name: `hiddenAction_rwasmaction_${name}_${index}`,
            props: [
              ['buildSpeed', '0'],
              instructions.length > index + 1 && [
                'alsoTriggerAction',
                `rwasmaction_${name}_${index + 1}`,
              ],
              ...compileInstruction(inst, name, index),
            ].filter(x => x),
          })),
        ])
        .reduce((p, c) => [...p, ...c], []),
    ],
  }
}

/** @type {(asm: import("./types").RWASM) => import("./types").RWASM} */
export function optimize(asm) {
  return {
    ...asm,
    actions: asm.actions.map(action => ({
      name: action.name,
      instructions: action.instructions.reduce((p, inst) => {
        if (p.length <= 0) {
          return [inst]
        }
        switch (inst.type) {
          default:
            return [...p, inst]
          case 'setmem':
            if (p[p.length - 1].type === 'setmem') {
              return [
                ...p.slice(0, -1),
                {
                  type: 'setmem',
                  sets: [...p[p.length - 1].sets, ...inst.sets],
                },
              ]
            } else {
              return [...p, inst]
            }
        }
      }, []),
    })),
  }
}
