import { compile } from '../index.js'

compile('@type("number") let a\nfn abc() {\na = a + 1\n}')
