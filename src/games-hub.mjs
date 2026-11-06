import { encodeRom, emulatorDocument, romPlatform } from './rom-platforms.mjs'
import { listGameRecordings, saveGameRecording } from './game-recordings.mjs'
import { DEFAULT_NES_KEYS, NES_KEY_ACTIONS, NES_PLAYER_TWO_KEYS, NES_PROFILE_PREFIX, nesKeyboardMap, nesRomId, normalizeNesProfile } from './nes-keys.mjs'
import { validateNesRom } from './nes-rom.mjs'

export const GAME_TYPES = [
  { id: 'pulse', name: 'Импульс', icon: '⚡', description: 'Нажимай на ядро, пока не вышло время.' },
  { id: 'math', name: 'Математика', icon: '✦', description: 'Решай примеры и набирай очки.' },
  { id: 'reaction', name: 'Реакция', icon: '◎', description: 'Дождись сигнала и нажми как можно быстрее.' },
  { id: 'memory', name: 'Память', icon: '▦', description: 'Находи одинаковые пары.' },
  { id: 'sequence', name: 'Последовательность', icon: '◈', description: 'Повтори порядок вспыхнувших кнопок.' },
]

export const GAMES = GAME_TYPES.flatMap((type) => Array.from({ length: 20 }, (_, index) => ({
  id: `${type.id}-${index + 1}`,
  type: type.id,
  level: index + 1,
  title: `${type.name} · уровень ${index + 1}`,
  icon: type.icon,
  description: type.description,
})))

export const FEATURED_GAMES = [
  { id: '2048', title: '2048', description: 'Объединяй плитки стрелками. Автор: Gabriele Cirulli · MIT.', url: 'https://gabrielecirulli.github.io/2048/' },
  { id: 'astray', title: 'Astray', description: 'Проведи шар через лабиринт стрелками. Автор: wwwtyro · Unlicense.', url: 'https://wwwtyro.github.io/Astray/' },
]

let nesScriptPromise

export function loadNesEmulator() {
  if (globalThis.jsnes?.Browser) return Promise.resolve(globalThis.jsnes)
  if (!nesScriptPromise) {
    nesScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = new URL('./jsnes.min.js', document.baseURI).href
      script.onload = () => globalThis.jsnes?.Browser ? resolve(globalThis.jsnes) : reject(new Error('NES-эмулятор недоступен'))
      script.onerror = () => reject(new Error('Не удалось загрузить NES-эмулятор'))
      document.head.append(script)
    }).catch((error) => { nesScriptPromise = null; throw error })
  }
  return nesScriptPromise
}

const styles = `
.hub { color:#f3f4ef;font:14px Arial,sans-serif;text-align:left }
.hub * { box-sizing:border-box }
.hub button,.hub input { font:inherit }
.hub-head { display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px }
.hub-head h2 { margin:0;font-size:21px }.hub-head span { color:#a7b0a7 }
.hub-filter { width:100%;padding:11px;border:1px solid #394139;border-radius:10px;background:#161c16;color:white;margin-bottom:12px }
.hub-categories { display:flex;gap:7px;overflow:auto;padding-bottom:10px }
.hub-categories button,.hub-back,.hub-reset { flex:none;padding:8px 12px;border:1px solid #394139;border-radius:9px;background:#1b231b;color:#d5ddd5;cursor:pointer }
.hub-categories button.active { color:#111;background:#caff3d }
.hub-list { max-height:350px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:9px }
.hub-card { padding:13px;border:1px solid #394139;border-radius:12px;background:#1a211a;color:#f3f4ef;text-align:left;cursor:pointer }
.hub-card:hover { border-color:#caff3d }.hub-card strong,.hub-card small { display:block }.hub-card strong { margin:8px 0 5px }.hub-card small { color:#abb4ab }
.hub-stage { min-height:250px;padding:17px;border:1px solid #394139;border-radius:13px;background:#111711;text-align:center }
.hub-stage h3 { margin:4px 0 10px }.hub-stage p { color:#b9c3b9 }.hub-score { margin:12px;color:#caff3d;font-weight:bold }
.hub-action,.hub-option,.hub-tile { padding:11px 16px;border:0;border-radius:10px;background:#caff3d;color:#111;cursor:pointer;font-weight:bold }
.hub-action { min-width:110px;min-height:55px }.hub-option { margin:5px }.hub-action:disabled { opacity:.5;cursor:default }
.hub-grid { max-width:320px;margin:14px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:7px }
.hub-tile { aspect-ratio:1;padding:3px;background:#283728;color:white;font-size:22px }.hub-tile.open { background:#caff3d;color:#111 }.hub-tile.flash { background:#ff784e }
.hub-target { position:relative;height:190px;margin:12px auto;border-radius:12px;background:#182318 }.hub-target button { position:absolute;width:42px;height:42px;border:0;border-radius:50%;background:#caff3d;color:#111;cursor:pointer }
.hub-import { margin-top:18px;padding:15px;border:1px solid #394139;border-radius:12px;background:#141a14 }
.hub-import summary { cursor:pointer;font-weight:bold }.hub-import p { color:#aab5aa;line-height:1.5 }
.hub-import input { max-width:100%;margin:10px 0 }.hub-import iframe { display:block;width:100%;height:420px;margin-top:12px;border:1px solid #394139;border-radius:10px;background:#fff }
.hub-import iframe[hidden] { display:none }
.hub-nes-screen { width:min(512px,100%);aspect-ratio:256/240;margin:14px auto;background:#050605;border:2px solid #384538;border-radius:10px;overflow:hidden }
.hub-nes-screen canvas { width:100%;height:100%;image-rendering:pixelated }
.hub-nes-controls { display:flex;justify-content:center;gap:8px;flex-wrap:wrap }.hub-nes-controls button { padding:9px 14px;border:1px solid #394139;border-radius:9px;background:#caff3d;color:#111;cursor:pointer }
.hub-nes-controls button:disabled { opacity:.5;cursor:default }.hub-nes-message { color:#aab5aa;line-height:1.5 }
.hub-nes-pad { display:flex;justify-content:center;gap:20px;align-items:center;flex-wrap:wrap;margin-top:15px;touch-action:none;user-select:none }
.hub-nes-pad button { min-width:42px;min-height:42px;border:1px solid #566356;border-radius:9px;background:#283728;color:#fff;touch-action:none }
.hub-nes-pad button:active { background:#caff3d;color:#111 }
.hub-key-settings { margin-top:14px;padding:13px;border:1px solid #394139;border-radius:10px }
.hub-key-settings summary { cursor:pointer;font-weight:bold }
.hub-key-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:14px 0 }
.hub-key-grid button,.hub-key-reset { padding:9px;border:1px solid #566356;border-radius:8px;background:#263026;color:#fff;text-align:left;cursor:pointer }
.hub-key-grid button.waiting { border-color:#caff3d;color:#caff3d }
.hub-key-settings p { color:#aab5aa }
.hub-key-row { display:grid;gap:5px }.hub-key-row input { min-width:0;padding:8px;border:1px solid #566356;border-radius:8px;background:#161c16;color:#fff }
.hub-platform-frame { display:block;width:100%;height:min(640px,75vh);margin-top:12px;border:1px solid #394139;border-radius:10px;background:#050605 }
.hub-platform-frame[hidden] { display:none }
.hub-featured { margin:16px 0;padding:15px;border:1px solid #394139;border-radius:12px;background:#141a14 }.hub-featured h3 { margin:0 0 6px }.hub-featured>p { color:#aab5aa }
.hub-featured-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px }.hub-featured a { display:block;padding:13px;border:1px solid #394139;border-radius:10px;background:#1a211a;color:#f3f4ef;text-decoration:none }
.hub-featured a:hover,.hub-featured a:focus-visible { border-color:#caff3d }.hub-featured a strong,.hub-featured a small { display:block }.hub-featured a small { margin-top:7px;color:#aab5aa;line-height:1.4 }
.hub-key-hint { margin:10px 0;color:#aab5aa }
.hub-recordings { margin-top:16px;padding:14px;border:1px solid #394139;border-radius:10px;background:#141a14 }
.hub-recordings summary { cursor:pointer;font-weight:bold }.hub-recordings article { margin-top:12px;padding:10px;border:1px solid #394139;border-radius:9px }
.hub-recordings article b,.hub-recordings article small { display:block;margin-bottom:6px }.hub-recordings video { display:block;width:min(512px,100%);margin:8px 0 }
`

export function mountGamesHub(root, options = {}) {
  if (!root) return () => {}
  const style = document.createElement('style')
  style.textContent = styles
  root.append(style)
  const body = document.createElement('div')
  body.className = 'hub'
  root.append(body)
  let selected = null
  let category = 'all'
  let query = ''
  let disposed = false
  let timer
  let gameUrl
  let platformUrl
  let nesFallbackUrl
  let nesBrowser
  let nesPlaying = false
  let nesPanel
  let nesLoadId = 0
  let activeNesPane
  const heldNesKeys = new Set()
  const releaseNesKeys = () => {
    if (nesBrowser) for (const code of heldNesKeys) nesBrowser.keyboard.handleKeyUp({ keyCode: code, preventDefault() {} })
    heldNesKeys.clear()
  }
  const handleNesKeyDown = (event) => {
    if (!nesBrowser || !nesPlaying || !nesPanel?.open || root.closest('[hidden]') || document.hidden || pendingKeyAssignment || event.altKey || event.metaKey ||
      event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return
    const code = event.keyCode || event.which
    if (event.ctrlKey && code !== 17) return
    if ((code === 13 || code === 32) && event.target?.closest?.('button,a,summary,video')) return
    if (!nesBrowser.keyboard.keys[code]) return
    event.preventDefault()
    if (heldNesKeys.has(code)) return
    heldNesKeys.add(code)
    nesBrowser.keyboard.handleKeyDown(event)
  }
  const handleNesKeyUp = (event) => {
    const code = event.keyCode || event.which
    if (!heldNesKeys.has(code)) return
    event.preventDefault()
    nesBrowser?.keyboard.handleKeyUp(event)
    heldNesKeys.delete(code)
  }
  window.addEventListener('keydown', handleNesKeyDown)
  window.addEventListener('keyup', handleNesKeyUp)
  window.addEventListener('blur', releaseNesKeys)
  const releaseWhenHidden = () => { if (document.hidden) releaseNesKeys() }
  document.addEventListener('visibilitychange', releaseWhenHidden)
  let nesRecorder
  let recordingsOpen = false
  let recordingUrls = []
  let refreshRecordings = () => {}
  const expiryTimer = setInterval(() => { listGameRecordings().then(() => { if (recordingsOpen) refreshRecordings() }).catch(() => {}) }, 60 * 1000)
  listGameRecordings().catch(() => {})
  const clearRecordingUrls = () => { recordingUrls.forEach((url) => URL.revokeObjectURL(url)); recordingUrls = [] }
  const stopNesRecording = () => {
    if (nesRecorder?.state === 'recording') nesRecorder.stop()
    nesRecorder = null
  }
  const startNesRecording = (screen, title, message) => {
    if (!globalThis.MediaRecorder || !screen?.captureStream) { message.textContent = 'Игра запущена. Запись видео недоступна в этом браузере.'; return }
    try {
      const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
      if (!mimeType) throw new Error('Нет поддерживаемого видеоформата')
      const stream = screen.captureStream(20)
      const chunks = []
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 500000 })
      nesRecorder = recorder
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        stream.getTracks().forEach((track) => track.stop())
        saveGameRecording({ blob, title }).then(() => {
          if (!disposed && recordingsOpen) refreshRecordings()
        }).catch((reason) => { if (!disposed) message.textContent = `Не удалось сохранить запись: ${reason.message}` })
      }
      recorder.onerror = () => { message.textContent = 'Не удалось записать видео этой партии.' }
      recorder.start(1000)
    } catch (reason) { message.textContent = `Игра запущена. Запись недоступна: ${reason.message}` }
  }
  let pendingKeyAssignment
  const keyActions = NES_KEY_ACTIONS
  const defaultKeys = DEFAULT_NES_KEYS
  let currentRomId = ''
  let actionLabels = {}
  let keySettings = { ...defaultKeys }
  const saveProfile = () => {
    if (!currentRomId) return
    localStorage.setItem(NES_PROFILE_PREFIX + currentRomId, JSON.stringify({ keys: keySettings, labels: actionLabels }))
  }
  const applyKeys = () => {
    if (!nesBrowser) return
    releaseNesKeys()
    const keys = nesKeyboardMap(nesBrowser.keyboard.keys, keySettings, globalThis.jsnes.Controller)
    nesBrowser.keyboard.setKeys(keys)
  }
  const clearTimer = () => { clearTimeout(timer); clearInterval(timer) }
  const element = (tag, className, text) => {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined) node.textContent = text
    return node
  }
  const button = (text, action, className = 'hub-action') => {
    const node = element('button', className, text)
    node.type = 'button'
    node.addEventListener('click', action)
    return node
  }
  const keyboardActions = new Map()
  const handleGameKeys = (event) => {
    if (disposed || !selected || !root.contains(document.activeElement) && document.activeElement !== document.body) return
    const target = event.target
    if (target?.closest?.('input,textarea,select,summary,iframe,video')) return
    const action = keyboardActions.get(event.code)
    if (!action) return
    event.preventDefault()
    if (event.repeat) return
    action()
  }
  window.addEventListener('keydown', handleGameKeys)
  const bindKeys = (bindings) => { keyboardActions.clear(); for (const [code, action] of Object.entries(bindings)) keyboardActions.set(code, action) }
  const title = (parent, text) => parent.append(element('h3', '', text))
  const note = (parent, text) => parent.append(element('p', '', text))
  const score = (parent) => { const node = element('div', 'hub-score', 'Очки: 0'); parent.append(node); return (value) => { node.textContent = `Очки: ${value}` } }

  function play(game) {
    clearTimer()
    selected = game
    render()
  }

  function renderGame(stage, game) {
    const level = game.level
    title(stage, game.title)
    const keyHints = { pulse: 'Пробел / Enter — нажимать.', math: '1, 2, 3 — выбрать ответ.', reaction: 'Пробел / Enter — начать и нажать на сигнал.', memory: 'Стрелки — выбрать карту, пробел / Enter — открыть.', sequence: 'Пробел — начать, 1–4 — повторить последовательность.' }
    stage.append(element('p', 'hub-key-hint', keyHints[game.type]))
    if (game.type === 'pulse') {
      const time = Math.max(5, 16 - Math.floor(level / 2))
      const target = 8 + level * 2
      let remaining = time, points = 0, running = false
      note(stage, `Набери ${target} очков за ${time} секунд.`)
      const display = element('div', 'hub-score', `Время: ${remaining} · Очки: ${points}`)
      stage.append(display)
      const core = button('Старт', () => {
        if (!running) {
          running = true; points = 0; remaining = time; core.textContent = '+1'
          timer = setInterval(() => {
            remaining--; display.textContent = `Время: ${remaining} · Очки: ${points}`
            if (remaining <= 0) { clearTimer(); running = false; core.textContent = 'Ещё раз'; display.textContent = `${points >= target ? 'Победа!' : 'Попробуй снова.'} ${points}/${target}` }
          }, 1000)
        } else points++
        if (running) display.textContent = `Время: ${remaining} · Очки: ${points}`
      })
      stage.append(core)
      bindKeys({ Space: () => core.click(), Enter: () => core.click() })
    } else if (game.type === 'math') {
      let points = 0, rounds = 0
      const update = score(stage)
      const question = element('div', 'hub-score')
      const answers = element('div')
      stage.append(question, answers)
      const next = () => {
        if (rounds >= 5) { question.textContent = points >= 3 ? 'Победа!' : 'Попробуй ещё раз'; answers.replaceChildren(button('Повторить', () => { points = 0; rounds = 0; update(points); next() })); return }
        const a = 2 + Math.floor(Math.random() * (level + 5)), b = 1 + Math.floor(Math.random() * (level + 4))
        const multiply = level > 10 && rounds % 2 === 0
        const result = multiply ? a * b : a + b
        question.textContent = `${a} ${multiply ? '×' : '+'} ${b} = ? (${rounds + 1}/5)`
        answers.replaceChildren()
        const variants = [result, result + Math.max(1, level), result - 1].sort(() => Math.random() - .5)
        variants.forEach((value) => answers.append(button(String(value), () => { if (value === result) { points++; update(points) }; rounds++; next() }, 'hub-option')))
      }
      next()
      bindKeys(Object.fromEntries(['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3'].map((code, index) => [code, () => answers.children[index % 3]?.click()])))
    } else if (game.type === 'reaction') {
      let started = 0, waiting = false
      note(stage, `Дождись зелёной кнопки. Цель: меньше ${Math.max(230, 700 - level * 20)} мс.`)
      const message = element('div', 'hub-score', 'Нажми «Старт»')
      stage.append(message)
      const action = button('Старт', () => {
        if (waiting) { clearTimer(); waiting = false; message.textContent = 'Слишком рано!'; action.textContent = 'Ещё раз'; return }
        if (started) { const elapsed = Math.round(performance.now() - started); message.textContent = `${elapsed} мс — ${elapsed < Math.max(230, 700 - level * 20) ? 'победа!' : 'попробуй ещё раз'}`; started = 0; action.textContent = 'Ещё раз'; return }
        waiting = true; action.textContent = 'Жди...'; message.textContent = 'Не нажимай пока!'
        timer = setTimeout(() => { waiting = false; started = performance.now(); action.textContent = 'ЖМИ!'; message.textContent = 'Сейчас!' }, 800 + Math.random() * 2400)
      })
      stage.append(action)
      bindKeys({ Space: () => action.click(), Enter: () => action.click() })
    } else if (game.type === 'memory') {
      const pairs = Math.min(8, 3 + Math.floor(level / 4))
      let deck, opened, found, locked
      const display = element('div', 'hub-score')
      const grid = element('div', 'hub-grid')
      stage.append(display, grid)
      const reset = () => {
        deck = Array.from({ length: pairs * 2 }, (_, index) => ({ value: index % pairs, id: index })).sort(() => Math.random() - .5)
        opened = []; found = new Set(); locked = false; grid.replaceChildren(); display.textContent = `Найдено: 0/${pairs}`
        deck.forEach((card, index) => {
          const tile = button('?', () => {
            if (locked || found.has(index) || opened.includes(index)) return
            tile.textContent = String.fromCodePoint(0x2605 + card.value); tile.classList.add('open'); opened.push(index)
            if (opened.length !== 2) return
            const [first, second] = opened
            if (deck[first].value === deck[second].value) {
              found.add(first); found.add(second); opened = []; display.textContent = `Найдено: ${found.size / 2}/${pairs}`
              if (found.size === deck.length) display.textContent = 'Все пары найдены — победа!'
            } else { locked = true; timer = setTimeout(() => { [first, second].forEach((position) => { grid.children[position].textContent = '?'; grid.children[position].classList.remove('open') }); opened = []; locked = false }, Math.max(400, 1050 - level * 25)) }
          }, 'hub-tile')
          grid.append(tile)
        })
      }
      stage.append(button('Перемешать', () => { clearTimer(); reset() }, 'hub-reset'))
      reset()
      let focused = 0
      const focusCard = () => grid.children[focused]?.focus()
      bindKeys({ ArrowLeft: () => { focused = (focused + deck.length - 1) % deck.length; focusCard() }, ArrowRight: () => { focused = (focused + 1) % deck.length; focusCard() }, ArrowUp: () => { focused = (focused + deck.length - 4) % deck.length; focusCard() }, ArrowDown: () => { focused = (focused + 4) % deck.length; focusCard() }, Space: () => grid.children[focused]?.click(), Enter: () => grid.children[focused]?.click() })
    } else {
      const count = Math.min(8, 2 + Math.floor(level / 3))
      const display = element('div', 'hub-score', `Повтори ${count} вспышки`)
      const grid = element('div', 'hub-grid')
      stage.append(display, grid)
      const tiles = Array.from({ length: 4 }, (_, index) => button(String(index + 1), () => {
        if (!ready) return
        if (sequence[position] !== index) { ready = false; display.textContent = 'Ошибка. Попробуй ещё раз.'; return }
        position++
        if (position === count) { ready = false; display.textContent = 'Последовательность верна — победа!' }
      }, 'hub-tile'))
      grid.append(...tiles)
      let sequence = [], position = 0, ready = false
      const begin = () => {
        clearTimer(); ready = false; position = 0; sequence = Array.from({ length: count }, () => Math.floor(Math.random() * 4)); display.textContent = 'Запоминай...'
        let step = 0
        const flash = () => {
          if (step >= count) { display.textContent = 'Твой ход!'; ready = true; return }
          const tile = tiles[sequence[step++]]; tile.classList.add('flash')
          timer = setTimeout(() => { tile.classList.remove('flash'); timer = setTimeout(flash, 200) }, Math.max(240, 650 - level * 17))
        }
        timer = setTimeout(flash, 350)
      }
      const startSequence = button('Показать', begin)
      stage.append(startSequence)
      bindKeys({ Digit1: () => tiles[0].click(), Digit2: () => tiles[1].click(), Digit3: () => tiles[2].click(), Digit4: () => tiles[3].click(), Numpad1: () => tiles[0].click(), Numpad2: () => tiles[1].click(), Numpad3: () => tiles[2].click(), Numpad4: () => tiles[3].click(), Space: () => startSequence.click() })
    }
  }

  function render() {
    if (disposed) return
    nesLoadId++
    pendingKeyAssignment?.abort()
    pendingKeyAssignment = null
    releaseNesKeys()
    nesPanel = null
    keyboardActions.clear()
    stopNesRecording()
    clearRecordingUrls()
    if (activeNesPane) { activeNesPane.removeAttribute('src'); activeNesPane = null }
    if (nesFallbackUrl) { URL.revokeObjectURL(nesFallbackUrl); nesFallbackUrl = null }
    if (nesBrowser) { nesBrowser.destroy(); nesBrowser = null; nesPlaying = false }
    body.replaceChildren()
    if (selected) {
      body.append(button('← Выбор игр', () => { clearTimer(); selected = null; render() }, 'hub-back'))
      const stage = element('section', 'hub-stage')
      body.append(stage)
      renderGame(stage, selected)
      return
    }
    if (options.initialGameId) {
      const invited = GAMES.find((game) => game.id === options.initialGameId)
      options.initialGameId = null
      if (invited) { play(invited); return }
    }
    const head = element('div', 'hub-head')
    head.append(element('h2', '', 'Игровой зал'), element('span', '', `${GAMES.length} уровней · 5 режимов`))
    body.append(head)
    const featured = element('section', 'hub-featured')
    featured.append(element('h3', '', 'Готовые игры'), element('p', '', 'Наши 100 уровней — ниже. Сторонние игры открываются на сайтах авторов в новой вкладке.'))
    const featuredGrid = element('div', 'hub-featured-grid')
    FEATURED_GAMES.forEach((item) => {
      const link = element('a')
      link.href = item.url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.append(element('strong', '', item.title), element('small', '', item.description))
      featuredGrid.append(link)
    })
    featured.append(featuredGrid)
    body.append(featured)
    const filter = element('input', 'hub-filter')
    filter.placeholder = 'Найти игру или уровень...'
    filter.value = query
    filter.addEventListener('input', () => { query = filter.value; updateList() })
    body.append(filter)
    const categories = element('div', 'hub-categories')
    const list = element('div', 'hub-list')
    body.append(categories, list)
    const updateList = () => {
      list.replaceChildren()
      GAMES.filter((game) => (category === 'all' || game.type === category) && game.title.toLowerCase().includes(query.toLowerCase())).forEach((game) => {
        const card = button('', () => play(game), 'hub-card')
        card.append(element('span', '', game.icon), element('strong', '', game.title), element('small', '', game.description))
        list.append(card)
      })
      if (!list.childElementCount) list.append(element('p', '', 'Игры не найдены'))
    }
    ;[['all', 'Все'], ...GAME_TYPES.map((type) => [type.id, type.name])].forEach(([id, name]) => {
      const tab = button(name, () => { category = id; categories.querySelectorAll('button').forEach((item) => item.classList.remove('active')); tab.classList.add('active'); updateList() }, id === category ? 'active' : '')
      categories.append(tab)
    })
    updateList()
    const importPanel = element('details', 'hub-import')
    importPanel.append(element('summary', '', 'Запустить свою HTML-игру'))
    importPanel.append(element('p', '', 'Выберите один самодостаточный .html файл до 2 МБ. Он запускается локально в изолированном окне. EXE, APK, ROM и ZIP не запускаются; данные не отправляются на сервер.'))
    const picker = element('input')
    picker.type = 'file'; picker.accept = '.html,.htm,text/html'
    const frame = element('iframe')
    frame.title = 'Загруженная браузерная игра'
    frame.setAttribute('sandbox', 'allow-scripts')
    frame.hidden = true
    const error = element('p')
    picker.addEventListener('change', async () => {
      const file = picker.files?.[0]
      if (!file) return
      if (!/\.html?$/i.test(file.name) || file.size > 2 * 1024 * 1024) { error.textContent = 'Нужен HTML-файл размером до 2 МБ'; frame.hidden = true; return }
      try {
        const html = await file.text()
        if (!/<html\b|<!doctype\s+html/i.test(html)) throw new Error('Файл не похож на HTML-игру')
        if (gameUrl) URL.revokeObjectURL(gameUrl)
        const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'">`
        gameUrl = URL.createObjectURL(new Blob([policy, html], { type: 'text/html' }))
        frame.src = gameUrl
        frame.hidden = false
        error.textContent = 'Игра открыта локально в ограниченном окружении.'
      } catch (reason) { error.textContent = reason.message; frame.hidden = true }
    })
    importPanel.append(picker, error, frame)
    body.append(importPanel)

    nesPanel = element('details', 'hub-import')
    nesPanel.addEventListener('toggle', () => { if (!nesPanel.open) releaseNesKeys() })
    nesPanel.append(element('summary', '', 'Запустить NES ROM (.nes)'))
    nesPanel.append(element('p', '', 'Выбери свой .nes-файл и нажми Play. ROM запускается только на твоём устройстве. Клавиатура: стрелки — движение, X — A, Z — B, Enter — Start, Ctrl — Select. Клавиши можно изменить ниже.'))
    const romPicker = element('input')
    romPicker.type = 'file'; romPicker.accept = '.nes,application/octet-stream'
    const nesMessage = element('p', 'hub-nes-message', 'Выбери NES-файл до 4 МБ.')
    const nesScreen = element('div', 'hub-nes-screen')
    const nesControls = element('div', 'hub-nes-controls')
    let nesTitle = 'NES'
    let nesData
    const fallbackFrame = element('iframe', 'hub-platform-frame')
    fallbackFrame.title = 'Запасной NES-эмулятор'
    fallbackFrame.setAttribute('allow', 'autoplay; gamepad')
    fallbackFrame.setAttribute('sandbox', 'allow-scripts allow-pointer-lock')
    fallbackFrame.hidden = true
    const fallback = (reason) => {
      if (disposed || activeNesPane !== fallbackFrame) return
      releaseNesKeys()
      stopNesRecording()
      nesPlaying = false
      if (nesBrowser) { nesBrowser.destroy(); nesBrowser = null }
      nesScreen.replaceChildren()
      playButton.disabled = pauseButton.disabled = resetButton.disabled = true
      if (!nesData) { nesMessage.textContent = `Ошибка NES: ${reason}`; return }
      try {
        fallbackFrame.removeAttribute('src')
        if (nesFallbackUrl) URL.revokeObjectURL(nesFallbackUrl)
        nesFallbackUrl = URL.createObjectURL(new Blob([emulatorDocument('nes', encodeRom(nesData))], { type: 'text/html' }))
        fallbackFrame.src = nesFallbackUrl
        fallbackFrame.hidden = false
        nesMessage.textContent = `${reason} Запущен другой NES-эмулятор. Нажми Play внутри него; клавиши настраиваются в его меню.`
      } catch (error) { nesMessage.textContent = `Не удалось запустить запасной эмулятор: ${error.message}` }
    }
    const playButton = button('Play', () => {
      if (!nesBrowser || nesPlaying) return
      try {
        if (nesBrowser.nes.crashed) nesBrowser.nes.loadROM(nesData)
        nesBrowser.start(); nesPlaying = true; nesMessage.textContent = 'Игра запущена. Запись сохранится после паузы.'
        startNesRecording(nesScreen.querySelector('canvas'), nesTitle, nesMessage)
      } catch (reason) { fallback(`Ошибка запуска: ${reason.message}`) }
    })
    const pauseButton = button('Pause', () => { if (nesBrowser && nesPlaying) { releaseNesKeys(); stopNesRecording(); nesBrowser.stop(); nesPlaying = false; nesMessage.textContent = 'Пауза. Запись сохраняется на этом устройстве.' } })
    const resetButton = button('Reset', () => { if (nesBrowser) { try { releaseNesKeys(); stopNesRecording(); nesBrowser.nes.loadROM(nesData); nesMessage.textContent = 'Игра перезапущена.'; if (nesPlaying) startNesRecording(nesScreen.querySelector('canvas'), nesTitle, nesMessage) } catch (reason) { fallback(`Не удалось перезапустить ROM: ${reason.message}`) } } })
    playButton.disabled = pauseButton.disabled = resetButton.disabled = true
    nesControls.append(playButton, pauseButton, resetButton)
    const pad = element('div', 'hub-nes-pad')
    const padKeys = keyActions.map(([id, name]) => [id, name])
    padKeys.forEach(([id, name]) => {
      const control = button(name, () => {}, 'hub-nes-button')
      const press = (event) => { event.preventDefault(); if (nesBrowser) nesBrowser.nes.buttonDown(1, globalThis.jsnes.Controller[`BUTTON_${id}`]) }
      const release = (event) => { event.preventDefault(); if (nesBrowser) nesBrowser.nes.buttonUp(1, globalThis.jsnes.Controller[`BUTTON_${id}`]) }
      control.addEventListener('pointerdown', press)
      control.addEventListener('pointerup', release)
      control.addEventListener('pointercancel', release)
      control.addEventListener('pointerleave', release)
      pad.append(control)
    })
    romPicker.addEventListener('change', async () => {
      const loadId = ++nesLoadId
      const file = romPicker.files?.[0]
      if (!file) return
      stopNesRecording()
      releaseNesKeys()
      if (nesBrowser) { nesBrowser.destroy(); nesBrowser = null }
      nesPlaying = false
      playButton.disabled = pauseButton.disabled = resetButton.disabled = true
      fallbackFrame.hidden = true
      fallbackFrame.removeAttribute('src')
      if (nesFallbackUrl) { URL.revokeObjectURL(nesFallbackUrl); nesFallbackUrl = null }
      nesData = null
      currentRomId = ''
      actionLabels = {}
      keySettings = { ...defaultKeys }
      renderKeys()
      if (!/\.nes$/i.test(file.name) || file.size > 4 * 1024 * 1024) { nesMessage.textContent = 'Нужен .nes-файл до 4 МБ.'; return }
      try {
        const data = new Uint8Array(await file.arrayBuffer())
        if (disposed || loadId !== nesLoadId) return
        validateNesRom(data)
        const id = await nesRomId(data)
        if (disposed || loadId !== nesLoadId) return
        let savedProfile
        try { savedProfile = JSON.parse(localStorage.getItem(NES_PROFILE_PREFIX + id) || 'null') } catch { savedProfile = null }
        const profile = normalizeNesProfile(savedProfile)
        keySettings = profile.keys
        actionLabels = profile.labels
        currentRomId = id
        renderKeys()
        keyHelp.textContent = `Настройки для ${file.name}: выбери кнопку NES, назначь ей клавишу и при желании подпиши действие. Сохранено только на этом устройстве.`
        nesData = data
        nesTitle = file.name
        const jsnes = await loadNesEmulator()
        if (disposed || loadId !== nesLoadId) return
        nesScreen.replaceChildren()
        nesBrowser = new jsnes.Browser({ container: nesScreen, onError: (reason) => { fallback(`Ошибка игры: ${reason.message || reason}`) } })
        document.removeEventListener('keydown', nesBrowser.keyboard.handleKeyDown)
        document.removeEventListener('keyup', nesBrowser.keyboard.handleKeyUp)
        document.removeEventListener('keypress', nesBrowser.keyboard.handleKeyPress)
        applyKeys()
        nesBrowser.nes.loadROM(data)
        nesPlaying = false
        nesMessage.textContent = `${file.name} загружена. Нажми Play для запуска.`
        playButton.disabled = pauseButton.disabled = resetButton.disabled = false
      } catch (reason) { if (!disposed && loadId === nesLoadId) { if (nesData) fallback(`JSNES не открыл ROM: ${reason.message}`); else nesMessage.textContent = `Не удалось открыть ROM: ${reason.message}` } }
    })
    const keyPanel = element('details', 'hub-key-settings')
    keyPanel.append(element('summary', '', 'Настроить клавиши и действия этой NES-игры'))
    const keyHelp = element('p', '', 'Выбери .nes-файл, чтобы настроить клавиши именно для него. ROM сообщает только кнопки NES (↑ ↓ ← → A B Start Select), а не названия вроде «стрелять» или «прыгать». Подпиши действия сам: одна кнопка может делать разное в разных местах игры.')
    const keyGrid = element('div', 'hub-key-grid')
    const keyName = (code) => ({ 13: 'Enter', 17: 'Ctrl', 32: 'Space', 37: '←', 38: '↑', 39: '→', 40: '↓' })[code] || String.fromCharCode(code)
    const renderKeys = () => {
      pendingKeyAssignment?.abort()
      pendingKeyAssignment = null
      keyGrid.replaceChildren()
      for (const [id, label] of keyActions) {
        const row = element('div', 'hub-key-row')
        const control = button(`${label}${actionLabels[id] ? ` · ${actionLabels[id]}` : ''}: ${keyName(keySettings[id])}`, () => {
          if (!currentRomId) { keyHelp.textContent = 'Сначала выбери NES ROM.'; return }
          pendingKeyAssignment?.abort()
          releaseNesKeys()
          pendingKeyAssignment = new AbortController()
          control.textContent = `${label}: нажми клавишу...`
          control.classList.add('waiting')
          const assign = (event) => {
            event.preventDefault()
            event.stopImmediatePropagation()
            if (event.key === 'Escape') { keyHelp.textContent = 'Изменение отменено.'; renderKeys(); return }
            const code = event.keyCode || event.which
            if (!code || code > 255 || NES_PLAYER_TWO_KEYS.has(code) || Object.entries(keySettings).some(([other, used]) => other !== id && used === code) || (nesBrowser && nesBrowser.keyboard.keys[code]?.[0] === 2)) { keyHelp.textContent = 'Клавиша уже занята или не поддерживается. Выбери другую.'; renderKeys(); return }
            keySettings[id] = code
            try { saveProfile() } catch (reason) { keyHelp.textContent = `Не удалось сохранить настройку: ${reason.message}`; applyKeys(); renderKeys(); return }
            keyHelp.textContent = `${label}: ${keyName(code)}. Настройка сохранена.`
            applyKeys()
            renderKeys()
          }
          window.addEventListener('keydown', assign, { capture: true, once: true, signal: pendingKeyAssignment.signal })
        })
        const actionName = element('input')
        actionName.type = 'text'
        actionName.maxLength = 32
        actionName.placeholder = 'Действие в этой игре (необязательно)'
        actionName.setAttribute('aria-label', `Название действия для кнопки ${label}`)
        actionName.value = actionLabels[id] || ''
        actionName.disabled = !currentRomId
        actionName.addEventListener('change', () => {
          const name = actionName.value.trim().slice(0, 32)
          if (name) actionLabels[id] = name
          else delete actionLabels[id]
          actionName.value = name
          control.textContent = `${label}${name ? ` · ${name}` : ''}: ${keyName(keySettings[id])}`
          try { saveProfile() } catch (reason) { keyHelp.textContent = `Не удалось сохранить настройку: ${reason.message}` }
        })
        control.disabled = !currentRomId
        row.append(control, actionName)
        keyGrid.append(row)
      }
    }
    renderKeys()
    keyPanel.append(keyHelp, keyGrid, button('Сбросить настройки этой игры', () => { if (!currentRomId) return; keySettings = { ...defaultKeys }; actionLabels = {}; localStorage.removeItem(NES_PROFILE_PREFIX + currentRomId); applyKeys(); renderKeys() }, 'hub-key-reset'))
    nesPanel.append(romPicker, nesMessage, nesScreen, nesControls, pad, keyPanel, fallbackFrame)
    body.append(nesPanel)
    activeNesPane = fallbackFrame

    const recordingsPanel = element('details', 'hub-recordings')
    recordingsPanel.append(element('summary', '', 'Видеозаписи NES · 24 часа'))
    recordingsPanel.append(element('p', 'hub-nes-message', 'Записи сохраняются на этом устройстве после паузы или выхода из игры. Через сутки после окончания партии они удаляются.'))
    const recordingsList = element('div')
    recordingsPanel.append(recordingsList)
    refreshRecordings = async () => {
      if (disposed || !recordingsOpen) return
      try {
        const recordings = await listGameRecordings()
        if (disposed || !recordingsOpen) return
        clearRecordingUrls()
        recordingsList.replaceChildren()
        if (!recordings.length) recordingsList.append(element('p', '', 'Записей пока нет.'))
        recordings.forEach((recording) => {
          const entry = element('article')
          const video = element('video')
          video.controls = true
          const url = URL.createObjectURL(recording.blob)
          recordingUrls.push(url)
          video.src = url
          entry.append(element('b', '', recording.title), element('small', '', `До ${new Date(recording.endedAt + 86400000).toLocaleString('ru')}`), video)
          recordingsList.append(entry)
        })
      } catch (reason) { recordingsList.textContent = `Не удалось открыть записи: ${reason.message}` }
    }
    recordingsPanel.addEventListener('toggle', () => { recordingsOpen = recordingsPanel.open; if (recordingsOpen) refreshRecordings(); else clearRecordingUrls() })
    if (options.initialRecordings) { options.initialRecordings = false; recordingsPanel.open = true }
    body.append(recordingsPanel)

    const platformPanel = element('details', 'hub-import')
    platformPanel.append(element('summary', '', 'Запустить Game Boy / GBA / SNES / Mega Drive'))
    platformPanel.append(element('p', '', 'Поддерживаются .gb, .gbc, .gba, .sfc, .smc, .md, .gen и .bin. Система определяется автоматически. ROM остаётся в памяти устройства; для загрузки ядра нужен интернет.'))
    const platformPicker = element('input')
    platformPicker.type = 'file'
    platformPicker.accept = '.gb,.gbc,.gba,.sfc,.smc,.md,.gen,.bin'
    const platformMessage = element('p', 'hub-nes-message', 'Выбери ROM и нажми Play.')
    const platformFrame = element('iframe', 'hub-platform-frame')
    platformFrame.title = 'Эмулятор загруженной игры'
    platformFrame.setAttribute('sandbox', 'allow-scripts allow-pointer-lock')
    platformFrame.setAttribute('allow', 'autoplay; gamepad')
    platformFrame.hidden = true
    const platformPlay = button('Play', async () => {
      const file = platformPicker.files?.[0]
      const platform = romPlatform(file?.name)
      if (!file || !platform) { platformMessage.textContent = 'Выбери ROM поддерживаемой системы.'; return }
      if (file.size > platform.maxSize) { platformMessage.textContent = `Файл слишком большой для ${platform.name}.`; return }
      try {
        platformMessage.textContent = `Подготовка ${platform.name}...`
        const data = encodeRom(new Uint8Array(await file.arrayBuffer()))
        if (platformUrl) URL.revokeObjectURL(platformUrl)
        platformUrl = URL.createObjectURL(new Blob([emulatorDocument(platform.core, data)], { type: 'text/html' }))
        platformFrame.src = platformUrl
        platformFrame.hidden = false
        platformMessage.textContent = `${platform.name}: ${file.name}. Игра загружается внутри эмулятора.`
      } catch (reason) { platformMessage.textContent = `Не удалось запустить ROM: ${reason.message}` }
    })
    platformPanel.append(platformPicker, platformPlay, platformMessage, platformFrame)
    body.append(platformPanel)
  }
  render()
  return () => { disposed = true; pendingKeyAssignment?.abort(); releaseNesKeys(); window.removeEventListener('keydown', handleNesKeyDown); window.removeEventListener('keyup', handleNesKeyUp); window.removeEventListener('blur', releaseNesKeys); document.removeEventListener('visibilitychange', releaseWhenHidden); window.removeEventListener('keydown', handleGameKeys); clearInterval(expiryTimer); clearTimer(); stopNesRecording(); clearRecordingUrls(); if (nesBrowser) nesBrowser.destroy(); if (gameUrl) URL.revokeObjectURL(gameUrl); if (platformUrl) URL.revokeObjectURL(platformUrl); if (nesFallbackUrl) URL.revokeObjectURL(nesFallbackUrl); root.replaceChildren() }
}
