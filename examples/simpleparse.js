import { parse } from '../parse.js'
import { tokenize } from '../token.js'

parse(tokenize('fn a(b) { k }'))
