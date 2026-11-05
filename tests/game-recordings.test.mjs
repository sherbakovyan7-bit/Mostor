import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isRecordingExpired, RECORDING_LIFETIME } from '../src/game-recordings.mjs'

test('recordings expire 24 hours after the game ends', () => {
  const endedAt = 1000
  assert.equal(isRecordingExpired({ endedAt }, endedAt + RECORDING_LIFETIME - 1), false)
  assert.equal(isRecordingExpired({ endedAt }, endedAt + RECORDING_LIFETIME), true)
  assert.equal(isRecordingExpired({ endedAt: undefined }), true)
})
