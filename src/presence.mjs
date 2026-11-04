export const PRESENCE_TIMEOUT_MS = 45_000

export function isOnline(profile, now = Date.now()) {
  if (!profile || profile.statusMode === 'invisible' || profile.presence !== true) return false
  const lastSeen = profile.lastSeen?.toMillis?.() ?? profile.lastSeen
  return typeof lastSeen === 'number' && lastSeen <= now && now - lastSeen < PRESENCE_TIMEOUT_MS
}

export function presenceLabel(profile, now = Date.now()) {
  if (!isOnline(profile, now)) return 'Не в сети'
  return { busy: 'Занят', dnd: 'Не беспокоить' }[profile.statusMode] || 'В сети'
}
