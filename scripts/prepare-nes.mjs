import { copyFileSync, mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })
copyFileSync('node_modules/jsnes/dist/jsnes.min.js', 'public/jsnes.min.js')
