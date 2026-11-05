import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FEATURED_GAMES, GAMES, GAME_TYPES } from '../src/games-hub.mjs'

test('game catalog contains 100 unique playable levels in five modes', () => {
  assert.equal(GAME_TYPES.length, 5)
  assert.equal(GAMES.length, 100)
  assert.equal(new Set(GAMES.map((game) => game.id)).size, 100)
  for (const type of GAME_TYPES) {
    assert.deepEqual(GAMES.filter((game) => game.type === type.id).map((game) => game.level), Array.from({ length: 20 }, (_, index) => index + 1))
  }
})

test('featured games link to the authors’ playable HTTPS pages', () => {
  assert.equal(FEATURED_GAMES.length, 2)
  for (const game of FEATURED_GAMES) {
    assert.ok(game.title)
    assert.match(game.url, /^https:\/\/[^/]+\//)
  }
})
