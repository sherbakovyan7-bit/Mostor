export function validateNesRom(data) {
  if (data.length < 16 || data[0] !== 0x4e || data[1] !== 0x45 || data[2] !== 0x53 || data[3] !== 0x1a) {
    throw new Error('Это не NES ROM (нет заголовка iNES).')
  }
  // JSNES otherwise silently pads truncated iNES ROMs with zeroes, which can crash on Play.
  if ((data[7] & 0x0c) !== 0x08) {
    const minimum = 16 + ((data[6] & 4) ? 512 : 0) + data[4] * 16384 + data[5] * 8192
    if (!data[4] || data.length < minimum) throw new Error('NES-файл неполный или повреждён. Выбери полную версию ROM.')
  }
}
