import { describe, expect, test } from '@jest/globals'
import { compile } from '../rwini'
import { parse } from '../parse'
import { tokenize } from '../token'

describe('compile', () => {
  test('simple', () => {
    expect(compile(parse(tokenize('fn a() {}')))).toEqual({
      hiddenAction_a: {},
    })
    expect(compile(parse(tokenize('fn a() {a = b;}')))).toEqual({
      hiddenAction_a: {
        setUnitMemory: 'a=memory.b',
      },
    })
  })
})
