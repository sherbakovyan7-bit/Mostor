export const ROM_PLATFORMS = Object.freeze({
  gb: { name: 'Game Boy', core: 'gb', maxSize: 8 * 1024 * 1024 },
  gbc: { name: 'Game Boy Color', core: 'gb', maxSize: 8 * 1024 * 1024 },
  gba: { name: 'Game Boy Advance', core: 'gba', maxSize: 16 * 1024 * 1024 },
  sfc: { name: 'SNES', core: 'snes', maxSize: 8 * 1024 * 1024 },
  smc: { name: 'SNES', core: 'snes', maxSize: 8 * 1024 * 1024 },
  md: { name: 'Sega Mega Drive', core: 'segaMD', maxSize: 8 * 1024 * 1024 },
  gen: { name: 'Sega Mega Drive', core: 'segaMD', maxSize: 8 * 1024 * 1024 },
  bin: { name: 'Sega Mega Drive', core: 'segaMD', maxSize: 8 * 1024 * 1024 },
})

export function romPlatform(fileName) {
  const extension = fileName?.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  return extension ? ROM_PLATFORMS[extension] || null : null
}

export function encodeRom(bytes) {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  return btoa(binary)
}

export function emulatorDocument(core, romBase64) {
  const safeCore = JSON.stringify(core)
  const safeRom = JSON.stringify(romBase64)
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#050605;color:#fff;font:14px Arial}#game{width:100%;height:100%}#error{position:absolute;top:12px;left:12px;right:12px;color:#ff8d69}</style></head><body><div id="game"></div><div id="error"></div><script>
  const bytes=Uint8Array.from(atob(${safeRom}),char=>char.charCodeAt(0));
  const romUrl=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));
  window.EJS_player='#game';window.EJS_core=${safeCore};window.EJS_gameUrl=romUrl;
  window.EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';
  window.addEventListener('pagehide',()=>URL.revokeObjectURL(romUrl));
  window.addEventListener('error',event=>{document.getElementById('error').textContent='Не удалось запустить эмулятор: '+event.message});
  <\/script><script src="https://cdn.emulatorjs.org/stable/data/loader.js" onerror="document.getElementById('error').textContent='Не удалось загрузить EmulatorJS: проверьте интернет и доступность CDN'"></script></body></html>`
}
