import { describe, expect, test } from '@jest/globals'
import { parse } from '../parse'
import { tokenize } from '../token'

describe('parse', () => {
  test('simple', () => {
    expect(parse(tokenize('a + 1;'))).toEqual([
      {
        type: 'add',
        left: {
          type: 'identifier',
          identifier: 'a',
        },
        right: {
          type: 'literalInt',
          content: '1',
        },
      },
    ])
    expect(parse(tokenize('{ k; }'))).toEqual([
      {
        type: 'block',
        statements: [
          {
            type: 'identifier',
            identifier: 'k',
          },
        ],
      },
    ])
    expect(parse(tokenize('!a(b);'))).toEqual([
      {
        type: 'not',
        expr: {
          type: 'call',
          fn: {
            type: 'identifier',
            identifier: 'a',
          },
          params: [
            {
              type: 'identifier',
              identifier: 'b',
            },
          ],
        },
      },
    ])
    expect(parse(tokenize('fn a(b) { k; }'))).toEqual([
      {
        type: 'functionDeclaration',
        identifier: {
          type: 'identifier',
          identifier: 'a',
        },
        params: [
          {
            type: 'identifier',
            identifier: 'b',
          },
        ],
        block: {
          type: 'block',
          statements: [
            {
              type: 'identifier',
              identifier: 'k',
            },
          ],
        },
      },
    ])
  })
})
