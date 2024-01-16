import { describe, expect, test } from '@jest/globals'
import { tokenize } from '../token'
describe('tokenize', () => {
  test('simple', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('abc')).toEqual([{ type: 'identifier', content: 'abc' }])
    expect(tokenize('fn abc(){1}')).toEqual([
      { type: 'keywordFn' },
      { type: 'identifier', content: 'abc' },
      { type: 'puncParrenLeft' },
      { type: 'puncParrenRight' },
      { type: 'puncBraceLeft' },
      { type: 'literalInt', content: '1' },
      { type: 'puncBraceRight' },
    ])
    expect(tokenize('fn test(){let mut c=a+b;}')).toEqual([
      { type: 'keywordFn' },
      { type: 'identifier', content: 'test' },
      { type: 'puncParrenLeft' },
      { type: 'puncParrenRight' },
      { type: 'puncBraceLeft' },
      { type: 'keywordLet' },
      { type: 'keywordMut' },
      { type: 'identifier', content: 'c' },
      { type: 'opAssign' },
      { type: 'identifier', content: 'a' },
      { type: 'opAdd' },
      { type: 'identifier', content: 'b' },
      { type: 'puncSemi' },
      { type: 'puncBraceRight' },
    ])
  })
})
