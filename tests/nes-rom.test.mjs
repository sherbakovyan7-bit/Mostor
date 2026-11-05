import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateNesRom } from '../src/nes-rom.mjs'

test('rejects truncated iNES ROMs instead of running padded memory', () => {
  const rom = new Uint8Array(16 + 16384 + 8192)
  rom.set([78, 69, 83, 26, 1, 1])
  assert.doesNotThrow(() => validateNesRom(rom))
  assert.throws(() => validateNesRom(rom.subarray(0, rom.length - 1)), /неполный/)
  assert.throws(() => validateNesRom(rom.subarray(0, 16)), /неполный/)
  rom[6] = 4
  assert.throws(() => validateNesRom(rom), /неполный/)
})
