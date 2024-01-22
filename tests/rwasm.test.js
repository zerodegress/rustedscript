import { describe, expect, test } from '@jest/globals'
import { compile, optimize } from '../rwasm'

describe('rwasm', () => {
  test('simple', () => {
    expect(
      compile({
        memories: {
          a: 'number',
        },
        externalActions: [],
        actions: [],
      }),
    ).toEqual({
      sections: [
        {
          name: 'core',
          props: [['@memory a', 'number']],
        },
      ],
    })
  })
  test('example', () => {
    expect(
      compile({
        memories: {
          a: 'number',
        },
        externalMemories: {},
        externalActions: [],
        actions: [
          {
            name: 'abc',
            instructions: [
              {
                type: 'setmem',
                sets: [['a', 'memory.a+1']],
              },
            ],
          },
        ],
      }),
    ).toEqual({
      sections: [
        {
          name: 'core',
          props: [['@memory a', 'number']],
        },
        {
          name: 'hiddenAction_abc',
          props: [
            ['buildSpeed', '0'],
            ['alsoTriggerAction', 'rwasmaction_abc_0'],
          ],
        },
        {
          name: 'hiddenAction_rwasmaction_abc_0',
          props: [
            ['buildSpeed', '0'],
            ['setUnitMemory', 'a=memory.a+1'],
          ],
        },
      ],
    })
    expect(
      optimize({
        memories: {
          a: 'number',
        },
        externalMemories: {},
        externalActions: [],
        actions: [
          {
            name: 'abc',
            instructions: [
              {
                type: 'setmem',
                sets: [['a', 'memory.a+1']],
              },
              {
                type: 'setmem',
                sets: [['a', 'memory.a*2']],
              },
            ],
          },
        ],
      }),
    ).toEqual({
      memories: {
        a: 'number',
      },
      externalMemories: {},
      externalActions: [],
      actions: [
        {
          name: 'abc',
          instructions: [
            {
              type: 'setmem',
              sets: [
                ['a', 'memory.a+1'],
                ['a', 'memory.a*2'],
              ],
            },
          ],
        },
      ],
    })
  })
})
