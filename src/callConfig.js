const stunServers = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

export function getIceServers() {
  const url = import.meta.env.VITE_TURN_URL?.trim()
  const username = import.meta.env.VITE_TURN_USERNAME?.trim()
  const credential = import.meta.env.VITE_TURN_CREDENTIAL?.trim()
  return url && username && credential
    ? [...stunServers, { urls: url.split(',').map((item) => item.trim()), username, credential }]
    : stunServers
}

export const hasTurnServer = Boolean(
  import.meta.env.VITE_TURN_URL &&
  import.meta.env.VITE_TURN_USERNAME &&
  import.meta.env.VITE_TURN_CREDENTIAL,
)
