import assert from 'node:assert/strict'
import { test } from 'node:test'
import { encodeRom, emulatorDocument, romPlatform } from '../src/rom-platforms.mjs'

test('recognizes supported ROM systems and rejects executables', () => {
  assert.equal(romPlatform('demo.GBA')?.core, 'gba')
  assert.equal(romPlatform('demo.gbc')?.core, 'gb')
  assert.equal(romPlatform('demo.sfc')?.core, 'snes')
  assert.equal(romPlatform('demo.gen')?.core, 'segaMD')
  assert.equal(romPlatform('demo.exe'), null)
})

test('builds an isolated emulator document from the exact ROM bytes', () => {
  const bytes = Uint8Array.from([0, 1, 127, 128, 255])
  const base64 = encodeRom(bytes)
  assert.equal(base64, 'AAF/gP8=')
  const html = emulatorDocument('gba', base64)
  assert.match(html, /EJS_core="gba"/)
  assert.match(html, /atob\("AAF\/gP8="\)/)
  assert.match(html, /cdn\.emulatorjs\.org\/stable\/data\/loader\.js/)
})
