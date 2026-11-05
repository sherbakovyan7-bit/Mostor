import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_NES_KEYS, nesKeyboardMap, normalizeNesKeys } from '../src/nes-keys.mjs'

test('NES keyboard maps arrows, X, Z, Enter and Ctrl to player one', () => {
  const controller = { BUTTON_UP: 4, BUTTON_DOWN: 5, BUTTON_LEFT: 6, BUTTON_RIGHT: 7, BUTTON_A: 0, BUTTON_B: 1, BUTTON_START: 3, BUTTON_SELECT: 2 }
  const oldKeys = { 88: [1, 0, 'X'], 89: [1, 1, 'Y'], 90: [1, 1, 'Z'], 103: [2, 0, 'Num-7'] }
  const keys = nesKeyboardMap(oldKeys, DEFAULT_NES_KEYS, controller)
  assert.deepEqual(keys[38].slice(0, 2), [1, controller.BUTTON_UP])
  assert.deepEqual(keys[88].slice(0, 2), [1, controller.BUTTON_A])
  assert.deepEqual(keys[90].slice(0, 2), [1, controller.BUTTON_B])
  assert.deepEqual(keys[13].slice(0, 2), [1, controller.BUTTON_START])
  assert.deepEqual(keys[17].slice(0, 2), [1, controller.BUTTON_SELECT])
  assert.equal(keys[89], undefined)
  assert.deepEqual(keys[103], oldKeys[103])
  const remapped = nesKeyboardMap(keys, { ...DEFAULT_NES_KEYS, A: 67 }, controller)
  assert.deepEqual(remapped[67].slice(0, 2), [1, controller.BUTTON_A])
  assert.equal(remapped[88], undefined)
})

test('invalid or duplicate saved NES keys fall back to defaults', () => {
  assert.deepEqual(normalizeNesKeys({ A: 0, B: 38, START: 'Escape' }), DEFAULT_NES_KEYS)
  assert.deepEqual(normalizeNesKeys({ A: 90, B: 88 }), { ...DEFAULT_NES_KEYS, A: 90, B: 88 })
  assert.deepEqual(normalizeNesKeys({ A: 90 }), DEFAULT_NES_KEYS)
  assert.deepEqual(normalizeNesKeys({ A: 103 }), DEFAULT_NES_KEYS)
  assert.equal(normalizeNesKeys({ A: 67 }).A, 67)
})
