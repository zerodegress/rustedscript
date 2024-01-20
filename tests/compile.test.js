import { describe, expect, test } from '@jest/globals'
import { compile } from '../compile'
import { parse } from '../parse'
import { tokenize } from '../token'

describe('compile', () => {
  test('simple', () => {
    expect(compile(parse(tokenize('@type("number") let a')))).toEqual({
      memories: {
        a: 'number',
      },
      externalMemories: {},
      externalActions: [],
      actions: [],
    })
  })

  test('action', () => {
    expect(
      compile(
        parse(tokenize('@type("number") let a\nfn abc() {\na = a + 1\n}')),
      ),
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
              sets: [['a', 'memory.a+1']],
            },
          ],
        },
      ],
    })
  })
})
