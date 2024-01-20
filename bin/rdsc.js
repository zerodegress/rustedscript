#!/usr/bin/env node
import readline from 'readline'
import process from 'process'
import console from 'console'
import { compile } from '../index.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

let src = ''

rl.on('line', line => {
  src += line + '\n'
})

rl.on('close', () => {
  console.log(compile(src))
})
