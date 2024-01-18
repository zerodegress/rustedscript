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
          content: 'a',
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
            content: 'k',
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
            content: 'a',
          },
          params: [
            {
              type: 'identifier',
              content: 'b',
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
          content: 'a',
        },
        params: [
          {
            type: 'identifier',
            content: 'b',
          },
        ],
        block: {
          type: 'block',
          statements: [
            {
              type: 'identifier',
              content: 'k',
            },
          ],
        },
      },
    ])
  })

  test('bind', () => {
    expect(parse(tokenize('let a = 1;'))).toEqual([
      {
        type: 'assign',
        left: {
          type: 'bindDeclaration',
          bind: {
            type: 'identifier',
            content: 'a',
          },
        },
        right: {
          type: 'literalInt',
          content: '1',
        },
      },
    ])
  })
})
