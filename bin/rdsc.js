#!/usr/bin/env node
import readline from 'node:readline'
import process from 'node:process'
import console from 'node:console'
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
