#!/usr/bin/env node
/**
 * Maps legacy Tailwind gray-* utilities to semantic theme tokens (foreground, muted, border, etc.).
 * Run after substantive UI refactors; safe to re-run (idempotent-ish).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const replacements = [
  ['bg-gray-100 text-gray-800', 'bg-muted text-foreground'],
  ['bg-gray-100 text-gray-700', 'bg-muted text-foreground'],
  ['bg-gray-50 text-gray-800', 'bg-muted/35 text-foreground'],
  ['bg-gray-600 bg-opacity-50', 'bg-black/50 backdrop-blur-sm'],
  ['text-gray-500 hover:text-gray-700', 'text-muted-foreground hover:text-foreground'],
  ['text-gray-700 hover:text-gray-900', 'text-muted-foreground hover:text-foreground'],
  ['hover:bg-gray-100', 'hover:bg-muted/70'],
  ['hover:bg-gray-50', 'hover:bg-muted/45'],
  ['hover:border-gray-300', 'hover:border-border'],
  ['divide-gray-200', 'divide-border'],
  ['ring-gray-200', 'ring-border'],
  ['border-gray-300', 'border-border'],
  ['border-gray-200', 'border-border'],
  ['border-gray-100', 'border-border/60'],
  ['disabled:bg-gray-100', 'disabled:bg-muted'],
  ['bg-gray-50', 'bg-muted/35'],
  ['bg-gray-100', 'bg-muted'],
  ['bg-gray-200', 'bg-muted'],
  ['text-gray-900', 'text-foreground'],
  ['text-gray-800', 'text-foreground'],
  ['text-gray-700', 'text-foreground/90'],
  ['text-gray-600', 'text-muted-foreground'],
  ['text-gray-500', 'text-muted-foreground'],
  ['text-gray-400', 'text-muted-foreground/75'],
]

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue
      walk(p, acc)
    } else if (name.endsWith('.jsx') || name.endsWith('.tsx')) {
      acc.push(p)
    }
  }
  return acc
}

const dirs = [path.join(ROOT, 'src', 'pages'), path.join(ROOT, 'src', 'components')]
let filesChanged = 0
let totalReplacements = 0

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue
  for (const file of walk(dir)) {
    let s = fs.readFileSync(file, 'utf8')
    const orig = s
    for (const [from, to] of replacements) {
      const n = (s.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      if (n) totalReplacements += n
      s = s.split(from).join(to)
    }
    if (s !== orig) {
      fs.writeFileSync(file, s)
      filesChanged++
    }
  }
}

console.log(`normalize-tailwind-grays: updated ${filesChanged} files (${totalReplacements} token replacements).`)
