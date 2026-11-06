export const NES_KEY_ACTIONS = [
  ['UP', '↑', 38], ['DOWN', '↓', 40], ['LEFT', '←', 37], ['RIGHT', '→', 39],
  ['A', 'A', 88], ['B', 'B', 90], ['START', 'Start', 13], ['SELECT', 'Select', 17],
]

export const DEFAULT_NES_KEYS = Object.fromEntries(NES_KEY_ACTIONS.map(([id, , code]) => [id, code]))

// JSNES reserves these numpad keys for the second controller.
export const NES_PLAYER_TWO_KEYS = new Set([97, 98, 99, 100, 102, 103, 104, 105])
export const NES_PROFILE_PREFIX = 'mostor-nes-controls-v1:'

export async function nesRomId(bytes) {
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function normalizeNesProfile(profile, defaults = DEFAULT_NES_KEYS) {
  const keys = normalizeNesKeys(profile?.keys ?? defaults)
  const labels = {}
  for (const [id] of NES_KEY_ACTIONS) {
    const label = profile?.labels?.[id]
    if (typeof label === 'string' && label.trim()) labels[id] = label.trim().slice(0, 32)
  }
  return { keys, labels }
}

export function normalizeNesKeys(saved) {
  const result = { ...DEFAULT_NES_KEYS }
  if (!saved || typeof saved !== 'object') return result
  for (const [id] of NES_KEY_ACTIONS) if (Object.hasOwn(saved, id)) result[id] = saved[id]
  const codes = Object.values(result)
  if (codes.some((code) => !Number.isInteger(code) || code < 1 || code > 255 || NES_PLAYER_TWO_KEYS.has(code)) ||
    new Set(codes).size !== codes.length) return { ...DEFAULT_NES_KEYS }
  return result
}

export function nesKeyboardMap(original, settings, controller) {
  const keys = Object.fromEntries(Object.entries(original).filter(([, binding]) => binding?.[0] !== 1))
  for (const [id, , code] of NES_KEY_ACTIONS) {
    const key = settings[id] ?? code
    keys[key] = [1, controller[`BUTTON_${id}`], String(key)]
  }
  return keys
}
