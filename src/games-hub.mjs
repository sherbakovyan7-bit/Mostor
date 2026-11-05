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
`

export function mountGamesHub(root) {
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
  let nesBrowser
  let nesPlaying = false
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
      stage.append(button('Показать', begin))
    }
  }

  function render() {
    if (disposed) return
    if (nesBrowser) { nesBrowser.destroy(); nesBrowser = null; nesPlaying = false }
    body.replaceChildren()
    if (selected) {
      body.append(button('← Выбор игр', () => { clearTimer(); selected = null; render() }, 'hub-back'))
      const stage = element('section', 'hub-stage')
      body.append(stage)
      renderGame(stage, selected)
      return
    }
    const head = element('div', 'hub-head')
    head.append(element('h2', '', 'Игровой зал'), element('span', '', `${GAMES.length} уровней · 5 режимов`))
    body.append(head)
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

    const nesPanel = element('details', 'hub-import')
    nesPanel.append(element('summary', '', 'Запустить NES ROM (.nes)'))
    nesPanel.append(element('p', '', 'Выбери свой .nes-файл и нажми Play. ROM запускается только на твоём устройстве и не загружается на сервер. Клавиши: стрелки — движение, X — A, Z — B, Enter — Start, Ctrl — Select.'))
    const romPicker = element('input')
    romPicker.type = 'file'; romPicker.accept = '.nes,application/octet-stream'
    const nesMessage = element('p', 'hub-nes-message', 'Выбери NES-файл до 4 МБ.')
    const nesScreen = element('div', 'hub-nes-screen')
    const nesControls = element('div', 'hub-nes-controls')
    const playButton = button('Play', () => {
      if (!nesBrowser || nesPlaying) return
      try { nesBrowser.start(); nesPlaying = true; nesMessage.textContent = 'Игра запущена.' } catch (reason) { nesMessage.textContent = `Ошибка запуска: ${reason.message}` }
    })
    const pauseButton = button('Pause', () => { if (nesBrowser && nesPlaying) { nesBrowser.stop(); nesPlaying = false; nesMessage.textContent = 'Пауза.' } })
    const resetButton = button('Reset', () => { if (nesBrowser) { nesBrowser.nes.reset(); nesMessage.textContent = 'Игра перезапущена.' } })
    playButton.disabled = pauseButton.disabled = resetButton.disabled = true
    nesControls.append(playButton, pauseButton, resetButton)
    const pad = element('div', 'hub-nes-pad')
    const padKeys = [['↑', 38], ['←', 37], ['↓', 40], ['→', 39], ['B', 90], ['A', 88], ['Start', 13], ['Select', 17]]
    padKeys.forEach(([name, keyCode]) => {
      const control = button(name, () => {}, 'hub-nes-button')
      const press = (event) => { event.preventDefault(); if (nesBrowser) nesBrowser.keyboard.handleKeyDown({ keyCode, preventDefault() {} }) }
      const release = (event) => { event.preventDefault(); if (nesBrowser) nesBrowser.keyboard.handleKeyUp({ keyCode, preventDefault() {} }) }
      control.addEventListener('pointerdown', press)
      control.addEventListener('pointerup', release)
      control.addEventListener('pointercancel', release)
      control.addEventListener('pointerleave', release)
      pad.append(control)
    })
    romPicker.addEventListener('change', async () => {
      const file = romPicker.files?.[0]
      if (!file) return
      if (!/\.nes$/i.test(file.name) || file.size > 4 * 1024 * 1024) { nesMessage.textContent = 'Нужен .nes-файл до 4 МБ.'; return }
      try {
        const data = new Uint8Array(await file.arrayBuffer())
        if (data.length < 16 || data[0] !== 0x4e || data[1] !== 0x45 || data[2] !== 0x53 || data[3] !== 0x1a) throw new Error('Это не NES ROM (нет заголовка iNES).')
        const jsnes = await loadNesEmulator()
        if (nesBrowser) nesBrowser.destroy()
        nesScreen.replaceChildren()
        nesBrowser = new jsnes.Browser({ container: nesScreen, onError: (reason) => { nesMessage.textContent = `Ошибка игры: ${reason.message || reason}` } })
        nesBrowser.loadROM(data)
        nesBrowser.stop()
        nesPlaying = false
        nesMessage.textContent = `${file.name} загружена. Нажми Play для запуска.`
        playButton.disabled = pauseButton.disabled = resetButton.disabled = false
      } catch (reason) { nesMessage.textContent = `Не удалось открыть ROM: ${reason.message}`; playButton.disabled = pauseButton.disabled = resetButton.disabled = true }
    })
    nesPanel.append(romPicker, nesMessage, nesScreen, nesControls, pad)
    body.append(nesPanel)
  }
  render()
  return () => { disposed = true; clearTimer(); if (nesBrowser) nesBrowser.destroy(); if (gameUrl) URL.revokeObjectURL(gameUrl); root.replaceChildren() }
}
