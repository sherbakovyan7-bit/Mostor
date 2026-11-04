import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isOnline, presenceLabel, PRESENCE_TIMEOUT_MS } from '../src/presence.mjs'

test('an old profile without a heartbeat is offline', () => {
  assert.equal(isOnline({ statusMode: 'online' }, 100_000), false)
  assert.equal(presenceLabel({ statusMode: 'online' }, 100_000), 'Не в сети')
})

test('a recent heartbeat is online and expires after the timeout', () => {
  const now = 100_000
  const profile = { presence: true, lastSeen: { toMillis: () => now - 1000 } }
  assert.equal(presenceLabel(profile, now), 'В сети')
  assert.equal(isOnline(profile, now + PRESENCE_TIMEOUT_MS), false)
})

test('offline and invisible take precedence over a saved custom mode', () => {
  const now = 100_000
  assert.equal(presenceLabel({ presence: false, statusMode: 'busy', lastSeen: now }, now), 'Не в сети')
  assert.equal(presenceLabel({ presence: true, statusMode: 'invisible', lastSeen: now }, now), 'Не в сети')
  assert.equal(presenceLabel({ presence: true, statusMode: 'dnd', lastSeen: now }, now), 'Не беспокоить')
})
