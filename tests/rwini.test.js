import { describe, expect, test } from '@jest/globals'
import { compile as compileToString } from '../rwini'
import { compile as compileToRWIni, optimize } from '../rwasm'
import { compile } from '../compile'
import { parse } from '../parse'
import { tokenize } from '../token'

describe('rwini', () => {
  test('simple', () => {
    expect(
      compileToString({
        sections: [
          {
            name: 'core',
            props: [['@memory a', 'number']],
          },
        ],
      }),
    ).toBe('[core]\n@memory a:number\n')
  })
  test('example', () => {
    expect(
      compileToString(
        compileToRWIni(
          compile(
            parse(tokenize('@type("number") let a\nfn abc() {\na = a + 1\n}')),
          ),
        ),
      ),
    ).toBe(
      '[core]\n@memory a:number\n[hiddenAction_abc]\nbuildSpeed:0\nsetUnitMemory:a=memory.a+1\n',
    )
    expect(
      compileToString(
        compileToRWIni(
          optimize(
            compile(
              parse(
                tokenize(
                  '@type("number") let a\nfn abc() {\na = a + 1\na = a * 2\n}',
                ),
              ),
            ),
          ),
        ),
      ),
    ).toBe(
      '[core]\n@memory a:number\n[hiddenAction_abc]\nbuildSpeed:0\nsetUnitMemory:a=memory.a+1,a=memory.a*2\n',
    )
  })
})
