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

  test('block', () => {
    expect(parse(tokenize('{}'))).toEqual([
      {
        type: 'block',
        statements: [],
      },
    ])

    expect(
      parse(tokenize('if true { true } else if a == b { 1 } else { false }')),
    ).toEqual([
      {
        type: 'if',
        cond: {
          type: 'literalBool',
          val: true,
        },
        then: {
          type: 'block',
          statements: [
            {
              type: 'literalBool',
              val: true,
            },
          ],
        },
        elseThen: {
          type: 'if',
          cond: {
            type: 'eq',
            left: {
              type: 'identifier',
              content: 'a',
            },
            right: {
              type: 'identifier',
              content: 'b',
            },
          },
          then: {
            type: 'block',
            statements: [
              {
                type: 'literalInt',
                content: '1',
              },
            ],
          },
          elseThen: {
            type: 'block',
            statements: [
              {
                type: 'literalBool',
                val: false,
              },
            ],
          },
        },
      },
    ])
  })

  test('anno', () => {
    expect(parse(tokenize('@type("string") let a'))).toEqual([
      {
        type: 'bindDeclaration',
        bind: {
          type: 'identifier',
          content: 'a',
        },
        anno: [
          {
            type: 'annotation',
            id: {
              type: 'identifier',
              content: 'type',
            },
            params: [
              {
                type: 'literalString',
                content: 'string',
              },
            ],
          },
        ],
      },
    ])
  })

  test('comment', () => {
    expect(parse(tokenize('// abc'))).toEqual([])
  })

  test('literal', () => {
    expect(parse(tokenize('"abc";'))).toEqual([
      {
        type: 'literalString',
        content: 'abc',
      },
    ])
    expect(parse(tokenize('true'))).toEqual([
      {
        type: 'literalBool',
        val: true,
      },
    ])
  })

  test('bind', () => {
    expect(parse(tokenize('let a = 1;'))).toEqual([
      {
        type: 'bindDeclaration',
        bind: {
          type: 'assign',
          left: {
            type: 'identifier',
            content: 'a',
          },
          right: {
            type: 'literalInt',
            content: '1',
          },
        },
      },
    ])
  })
})
