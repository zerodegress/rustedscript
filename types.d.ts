export interface WithRange {
  offset: number
  len: number
}

export interface NodeIdentifier {
  type: 'identifier'
  content: string
}

export interface NodeFunctionDeclaration {
  type: 'functionDeclaration'
  identifier: NodeIdentifier
  params: NodeUnknown[]
  block: NodeBlock
}

export interface NodeBlock {
  type: 'block'
  statements: NodeUnknown[]
}

export interface NodeAssign {
  type: 'assign'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeAdd {
  type: 'add'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeSub {
  type: 'sub'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeMul {
  type: 'mul'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeDiv {
  type: 'div'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeMod {
  type: 'mod'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeBindDeclaration {
  type: 'bindDeclaration'
  bind: NodeUnknown
  mutable?: true
}

export interface NodeLiteralInt {
  type: 'literalInt'
  content: string
}

export interface NodeLiteralFloat {
  type: 'literalFloat'
  content: string
}

export interface NodeTuple {
  type: 'tuple'
  exprs: NodeUnknown[]
}

export interface NodeIndex {
  type: 'index'
  arr: NodeUnknown
  index: NodeUnknown
}

export interface NodeCall {
  type: 'call'
  fn: NodeUnknown
  params: NodeUnknown[]
}

export interface NodeMember {
  type: 'member'
  obj: NodeUnknown
  member: NodeUnknown
}

export interface NodeNeg {
  type: 'neg'
  expr: NodeUnknown
}

export interface NodeNot {
  type: 'not'
  expr: NodeUnknown
}

export interface NodeGt {
  type: 'gt'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeGe {
  type: 'ge'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeLt {
  type: 'lt'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeLe {
  type: 'le'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeEq {
  type: 'eq'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeNe {
  type: 'ne'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeAnd {
  type: 'and'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeOr {
  type: 'or'
  left: NodeUnknown
  right: NodeUnknown
}

export interface NodeLiteralString {
  type: 'literalString'
  content: string
}

export type NodeUnknown =
  | NodeBlock
  | NodeFunctionDeclaration
  | NodeIdentifier
  | NodeAssign
  | NodeAdd
  | NodeSub
  | NodeMul
  | NodeDiv
  | NodeMod
  | NodeLiteralInt
  | NodeLiteralFloat
  | NodeBindDeclaration
  | NodeTuple
  | NodeIndex
  | NodeCall
  | NodeMember
  | NodeNeg
  | NodeNot
  | NodeGt
  | NodeGe
  | NodeLt
  | NodeLe
  | NodeGt
  | NodeGe
  | NodeEq
  | NodeNe
  | NodeAnd
  | NodeOr
  | NodeLiteralString

export interface TokenKeywordLet {
  type: 'keywordLet'
}

export interface TokenKeywordMut {
  type: 'keywordMut'
}

export interface TokenKeywordFn {
  type: 'keywordFn'
}

export interface TokenPuncParrenLeft {
  type: 'puncParrenLeft'
}

export interface TokenPuncParrenRight {
  type: 'puncParrenRight'
}

export interface TokenPuncBraceLeft {
  type: 'puncBraceLeft'
}

export interface TokenPuncBraceRight {
  type: 'puncBraceRight'
}

export interface TokenPuncBracketLeft {
  type: 'puncBracketLeft'
}

export interface TokenPuncBracketRight {
  type: 'puncBracketRight'
}

export interface TokenPuncDot {
  type: 'puncDot'
}

export interface TokenPuncComma {
  type: 'puncComma'
}

export interface TokenPuncSemi {
  type: 'puncSemi'
}

export interface TokenIdentifier {
  type: 'identifier'
  content: string
}

export interface TokenUnexpected {
  type: 'unexpected'
  content: string
}

export interface TokenLiteralInt {
  type: 'literalInt'
  content: string
}

export interface TokenLiteralFloat {
  type: 'literalFloat'
  content: string
}

export interface TokenOpAssign {
  type: 'opAssign'
}

export interface TokenOpAdd {
  type: 'opAdd'
}

export interface TokenOpSub {
  type: 'opSub'
}

export interface TokenOpMul {
  type: 'opMul'
}

export interface TokenOpDiv {
  type: 'opDiv'
}

export interface TokenOpMod {
  type: 'opMod'
}

export interface TokenPuncBang {
  type: 'puncBang'
}

export interface TokenOpGt {
  type: 'opGt'
}

export interface TokenOpGe {
  type: 'opGe'
}

export interface TokenOpLt {
  type: 'opLt'
}

export interface TokenOpLe {
  type: 'opLe'
}

export interface TokenOpEq {
  type: 'opEq'
}

export interface TokenOpNe {
  type: 'opNe'
}

export interface TokenOpAnd {
  type: 'opAnd'
}

export interface TokenOpOr {
  type: 'opOr'
}

export interface TokenLiteralString {
  type: 'literalString'
  content: string
}

export type TokenUnknown =
  | TokenKeywordFn
  | TokenKeywordLet
  | TokenKeywordMut
  | TokenPuncBraceLeft
  | TokenPuncBraceRight
  | TokenPuncBracketLeft
  | TokenPuncBracketRight
  | TokenPuncParrenLeft
  | TokenPuncParrenRight
  | TokenIdentifier
  | TokenUnexpected
  | TokenLiteralInt
  | TokenLiteralFloat
  | TokenOpAssign
  | TokenOpAdd
  | TokenOpSub
  | TokenOpMul
  | TokenOpDiv
  | TokenOpMod
  | TokenPuncDot
  | TokenPuncComma
  | TokenPuncSemi
  | TokenPuncBang
  | TokenOpGt
  | TokenOpGe
  | TokenOpLt
  | TokenOpLe
  | TokenOpEq
  | TokenOpNe
  | TokenOpOr
  | TokenOpAnd
  | TokenLiteralString

export interface RwIni {
  [secName: string]: RwIniSection
}

export interface RwIniSection {
  [propKey: string]: string
}
