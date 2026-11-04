import { useEffect, useRef, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import {
  ArrowLeft, Bell, Bookmark, Check, Cloud, Download, Film, FolderOpen, Gamepad2,
  FlaskConical, Gift, HardDrive, Heart, Home, Image, Menu, MessageCircle, MoreHorizontal,
  Mic, MicOff, Music2, Paperclip, Pause, Pencil, Phone, PhoneOff, Play, Plus, Save, Search,
  Send, Settings, ShoppingBag, Smile, Trophy, Trash2, Upload, UserPlus, Users,
  Video, VideoOff, X, Zap,
} from 'lucide-react'
import { auth, db } from './firebase'

const initialData = {
  profile: { name: 'Ян', username: 'yan', bio: 'Основатель Mostor', avatar: '', statusMode: 'online', statusText: '' },
  posts: [],
  videos: [],
  channels: [],
  friends: [],
  chats: {},
  cloudFiles: [],
  videoEngagement: {},
  chatGroups: [],
  groupChats: {},
  postDiscussions: {},
  coins: 500,
  giftInventory: [],
  sentGifts: [],
  gameStats: { reactionBest: 0, tictacGames: 0, memoryWins: 0 },
  questClaims: [],
  postReactions: {},
  messageReactions: {},
  savedPosts: [],
  callHistory: [],
  notifications: [],
  settings: { compact: false, reduceMotion: false, autoplay: true, sounds: true, timestamps: true, themeMode: 'dark', accent: '#caff3d', background: '#0b0d0b', scale: 100 },
  labFlags: {},
}


const navItems = [
  ['feed', 'Главная', Home],
  ['channels', 'Каналы', Users],
  ['video', 'Видео', Film],
  ['games', 'Игры', Gamepad2],
  ['gifts', 'Подарки', Gift],
  ['messages', 'Сообщения', MessageCircle],
  ['calls', 'Звонки', Phone],
  ['music', 'Музыка', Music2],
  ['status', 'Статус', Smile],
  ['stickers', 'Стикеры', Smile],
  ['friends', 'Друзья', UserPlus],
  ['cloud', 'Облако', Cloud],
  ['labs', 'Mostor Labs', FlaskConical],
  ['settings', 'Настройки', Settings],
  ['profile', 'Профиль', Settings],
]

const labGroups = [
  ['Лента', ['Умная сортировка','Тихая лента','Посты по расписанию','Черновики постов','Серии публикаций','Опросы в постах','Музыка в постах','Цветные темы постов','Скрытие просмотренного','Быстрый репост']],
  ['Общение', ['Исчезающие сообщения','Отложенная отправка','Редактирование сообщений','Закрепление сообщений','Ответы цепочкой','Перевод сообщений','Голосовые сообщения','Видеосообщения','Совместный просмотр','Статус набора текста']],
  ['Звонки', ['Шумоподавление','Размытие фона','Виртуальный фон','Демонстрация экрана','Запись звонка','Субтитры звонка','Режим рации','Групповой звонок','Экономия трафика','Поднятая рука']],
  ['Видео', ['Картинка в картинке','Продолжить просмотр','Скорость воспроизведения','Главы видео','Субтитры видео','Плейлисты','История просмотра','Мини-плеер','Фоновое воспроизведение','Зацикливание видео']],
  ['Каналы', ['Приватные каналы','Заявки на вступление','Роли участников','Комментарии канала','Закрепленные посты','Правила канала','Аналитика канала','Архив канала','Совместные авторы','Лента канала']],
  ['Профиль', ['Статус профиля','Обложка профиля','Витрина подарков','Ссылки профиля','Музыка профиля','Значки профиля','Гостевая книга','QR-код профиля','Архив историй','Режим невидимки']],
  ['Друзья', ['Близкие друзья','Списки друзей','Дни рождения','Общие друзья','Заметки о друзьях','Избранные контакты','Запрос геолокации','Совместные коллекции','Лента друзей','Быстрые подарки']],
  ['Облако', ['Общие папки','Версии файлов','Корзина файлов','Избранные файлы','Теги файлов','Предпросмотр документов','Сканер документов','Автозагрузка фото','Ссылки на файлы','Шифрование папок']],
  ['Игры', ['Таблица лидеров','Ежедневный бонус','Серия побед','Турниры','Достижения','Профиль игрока','Испытания друзей','Сезонный пропуск','Повторы партий','Игровые команды']],
  ['Безопасность', ['PIN-код приложения','Биометрический вход','Активные сессии','Черный список','Фильтр контента','Антиспам','Скрытие онлайна','Двухфакторная защита','Экспорт данных','Резервная копия']],
]

const labFeatures = labGroups.flatMap(([group, names]) => names.map((name, index) => ({ id: `${group}-${index}`, group, name })))

const giftCatalog = [
  { id: 'spark', name: 'Искра', symbol: '⚡', price: 80, rarity: 'Обычный', color: 'acid' },
  { id: 'heart', name: 'Неоновое сердце', symbol: '♥', price: 140, rarity: 'Редкий', color: 'red' },
  { id: 'planet', name: 'Малая планета', symbol: '◉', price: 220, rarity: 'Редкий', color: 'violet' },
  { id: 'crown', name: 'Корона Mostor', symbol: '♛', price: 400, rarity: 'Эпический', color: 'gold' },
  { id: 'cube', name: 'Киберкуб', symbol: '◆', price: 300, rarity: 'Эпический', color: 'blue' },
  { id: 'star', name: 'Сверхзвезда', symbol: '★', price: 600, rarity: 'Легендарный', color: 'orange' },
]

const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open('mostor-storage', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('files')
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

async function putFile(id, file) {
  const db = await dbPromise
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').put(file, id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

async function getFile(id) {
  const db = await dbPromise
  return new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function removeFile(id) {
  const db = await dbPromise
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').delete(id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

function useStoredData() {
  const [data, setData] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mostor-data')) || {}
      return { ...initialData, ...stored, gameStats: { ...initialData.gameStats, ...(stored.gameStats || {}) }, settings: { ...initialData.settings, ...(stored.settings || {}) } }
    }
    catch { return initialData }
  })
  useEffect(() => { localStorage.setItem('mostor-data', JSON.stringify(data)) }, [data])
  const update = (patch) => setData((current) => ({ ...current, ...patch }))
  return [data, update]
}

function useFileUrl(fileId) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!fileId) { setUrl(''); return }
    let objectUrl = ''
    getFile(fileId).then((blob) => {
      if (blob) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) }
    })
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [fileId])
  return url
}

function Avatar({ profile, size = 44 }) {
  const letter = (profile?.name || '?').trim().charAt(0).toUpperCase()
  const content = profile?.avatar
    ? <img className="avatar" style={{ width: size, height: size }} src={profile.avatar} alt="" />
    : <span className="avatar avatar-letter" style={{ width: size, height: size, fontSize: size * .38 }}>{letter}</span>
  if (!profile?.uid) return content
  return <button className="avatar-button" onClick={() => window.dispatchEvent(new CustomEvent('mostor:profile', { detail: profile }))}>{content}</button>
}

const statusLabels = { online: 'В сети', busy: 'Занят', dnd: 'Не беспокоить', invisible: 'Невидимый' }

function StatusBadge({ profile, compact = false }) {
  const mode = profile?.statusMode || 'online'
  if (mode === 'invisible' && compact) return <span className="user-status offline">Не в сети</span>
  return <span className={`user-status ${mode}`}><i />{profile?.statusText || statusLabels[mode]}</span>
}

function Sidebar({ active, setActive, profile }) {
  return <aside className="sidebar">
    <button className="logo" onClick={() => setActive('feed')}><span>M</span>ostor<b>.</b></button>
    <nav>{navItems.map(([id, label, Icon]) => <button className={active === id ? 'active' : ''} onClick={() => setActive(id)} key={id}><Icon size={21} /><span>{label}</span></button>)}</nav>
    <button className="side-create" onClick={() => setActive('feed')}><Plus size={20} /><span>Добавить пост</span></button>
    <button className="mini-profile" onClick={() => setActive('profile')}><Avatar profile={profile} size={40} /><span><b>{profile.name}</b><small>@{profile.username}</small></span><MoreHorizontal size={18} /></button>
  </aside>
}

function Topbar({ title, query, setQuery, openMenu, profile, notifications, openNotifications }) {
  return <header className="topbar">
    <button className="mobile-menu" onClick={openMenu}><Menu /></button>
    <h1>{title}</h1>
    <label className="global-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск в Mostor" /></label>
    <button className="top-icon" onClick={openNotifications}><Bell size={19} />{notifications > 0 && <i>{notifications}</i>}</button>
    <button className="account-exit" onClick={() => window.dispatchEvent(new CustomEvent('mostor:profile', { detail: profile }))} title="Открыть профиль"><Avatar profile={{ ...profile, uid: '' }} size={38} /></button>
  </header>
}

function Modal({ title, children, close, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><section className={`modal ${wide ? 'wide' : ''}`}><header><h2>{title}</h2><button onClick={close}><X /></button></header>{children}</section></div>
}

function Empty({ icon: Icon, title, text, action, actionText }) {
  return <div className="empty-state"><span><Icon /></span><h2>{title}</h2><p>{text}</p>{action && <button className="primary" onClick={action}><Plus size={18} />{actionText}</button>}</div>
}

function FreeStorageNotice({ type }) {
  const video = type === 'video'
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">БЕСПЛАТНЫЙ РЕЖИМ</span><h2>{video ? 'Видеохостинг' : 'Облако'}</h2><p>Firebase Storage требует платный тариф Blaze.</p></div></div><Empty icon={video ? Video : Cloud} title={video ? 'Большие видео временно отключены' : 'Большие файлы временно отключены'} text="В бесплатной версии можно отправлять изображения и файлы до 600 КБ через сообщения. Они сохраняются прямо в Firestore и доступны собеседнику." /></main>
}

function StatusPage({ data, update, currentUser }) {
  const [statusMode, setStatusMode] = useState(data.profile.statusMode || 'online')
  const [statusText, setStatusText] = useState(data.profile.statusText || '')
  const save = async () => {
    const profile = { ...data.profile, statusMode, statusText: statusText.trim().slice(0, 80), statusUpdatedAt: Date.now() }
    update({ profile })
    await setDoc(doc(db, 'users', currentUser.uid), profile, { merge: true })
  }
  return <main className="content-page status-page"><div className="page-heading"><div><span className="eyebrow">НАСТРОЕНИЕ</span><h2>Ваш статус</h2><p>Покажите людям, чем вы заняты прямо сейчас.</p></div></div><section className="status-editor panel"><div className="status-preview"><Avatar profile={data.profile} size={72} /><div><h3>{data.profile.name}</h3><StatusBadge profile={{ ...data.profile, statusMode, statusText }} /></div></div><div className="status-modes">{Object.entries(statusLabels).map(([id, label]) => <button className={statusMode === id ? `active ${id}` : id} onClick={() => setStatusMode(id)} key={id}><i />{label}</button>)}</div><label className="field">Текст статуса<input maxLength="80" value={statusText} onChange={(event) => setStatusText(event.target.value)} placeholder="Например: Работаю над новым проектом" /><small>{statusText.length} / 80</small></label><div className="status-actions"><button className="secondary" onClick={() => setStatusText('')}>Очистить текст</button><button className="primary" onClick={save}><Save />Сохранить статус</button></div></section></main>
}

function MusicPage({ tracks, setTracks, data, currentUser }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [url, setUrl] = useState('')
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const audio = useRef(null)
  useEffect(() => { if (!audio.current || !current) return; audio.current.src = current.url; audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false)) }, [current])
  const addTrack = async () => {
    if (!title.trim() || !url.trim()) return
    const trackRef = doc(collection(db, 'music'))
    const track = { id: trackRef.id, title: title.trim(), artist: artist.trim() || data.profile.name, url: url.trim(), uid: currentUser.uid, author: data.profile, createdAt: Date.now(), pending: true }
    setTracks((items) => [track, ...items.filter((item) => item.id !== track.id)])
    setTitle(''); setArtist(''); setUrl(''); setOpen(false)
    try { await setDoc(trackRef, { ...track, id: undefined, pending: undefined, createdAt: serverTimestamp() }) }
    catch (error) { setTracks((items) => items.filter((item) => item.id !== track.id)); window.alert(`Не удалось добавить трек: ${error.message}`) }
  }
  const toggle = () => { if (!audio.current || !current) return; if (playing) audio.current.pause(); else audio.current.play(); setPlaying(!playing) }
  return <main className="content-page music-page"><div className="page-heading"><div><span className="eyebrow">MOSTOR MUSIC</span><h2>Музыка</h2><p>Общая библиотека треков пользователей Mostor.</p></div><button className="primary" onClick={() => setOpen(true)}><Plus />Добавить трек</button></div>{tracks.length === 0 ? <Empty icon={Music2} title="Музыки пока нет" text="Добавьте первый трек по прямой ссылке на MP3, OGG или другой аудиофайл." action={() => setOpen(true)} actionText="Добавить трек" /> : <div className="music-list panel">{tracks.map((track, index) => <article className={current?.id === track.id ? 'active' : ''} key={track.id}><span className="track-number">{String(index + 1).padStart(2, '0')}</span><button className="track-play" onClick={() => current?.id === track.id ? toggle() : setCurrent(track)}>{current?.id === track.id && playing ? <Pause /> : <Play fill="currentColor" />}</button><div><b>{track.title}</b><small>{track.artist} · добавил {track.author?.name}</small></div>{track.uid === currentUser.uid && <button className="track-delete" onClick={() => deleteDoc(doc(db, 'music', track.id))}><Trash2 /></button>}</article>)}</div>}<audio ref={audio} onEnded={() => setPlaying(false)} />{current && <div className="music-player"><button onClick={toggle}>{playing ? <Pause /> : <Play fill="currentColor" />}</button><div><b>{current.title}</b><small>{current.artist}</small></div><audio src={current.url} controls onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /></div>}{open && <Modal title="Добавить музыку" close={() => setOpen(false)}><label className="field">Название<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название трека" /></label><label className="field">Исполнитель<input value={artist} onChange={(event) => setArtist(event.target.value)} placeholder="Исполнитель" /></label><label className="field">Прямая ссылка на аудио<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/song.mp3" /></label><p className="group-hint">Используйте прямую публичную ссылку на MP3, OGG или WAV. Ссылки на страницу YouTube не подходят.</p><button className="primary full" onClick={addTrack}>Добавить в библиотеку</button></Modal>}</main>
}

function AuthScreen() {
  const [mode, setMode] = useState('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('Введите имя не короче двух символов.')
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(credential.user, { displayName: name.trim() })
        await setDoc(doc(db, 'users', credential.user.uid), { name: name.trim(), username: email.split('@')[0], email: email.trim(), avatar: '', bio: 'Новый пользователь Mostor', createdAt: serverTimestamp() })
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (reason) {
      const messages = { 'auth/email-already-in-use': 'Этот email уже зарегистрирован.', 'auth/invalid-credential': 'Неверный email или пароль.', 'auth/weak-password': 'Пароль должен содержать минимум 6 символов.', 'auth/invalid-email': 'Введите корректный email.' }
      setError(messages[reason.code] || reason.message || 'Не удалось войти.')
    } finally { setLoading(false) }
  }

  return <main className="auth-screen"><section className="auth-brand"><div className="auth-logo"><span>M</span>ostor<b>.</b></div><span className="eyebrow">СОЦИАЛЬНАЯ СЕТЬ</span><h1>Ваши люди.<br />Ваши идеи.<br />Ваше пространство.</h1><p>Публикуйте посты и видео, общайтесь, создавайте каналы и играйте вместе.</p><div className="auth-features"><span><Users />Общая лента</span><span><Video />Видеохостинг</span><span><MessageCircle />Сообщения</span></div></section><section className="auth-panel"><div className="auth-card"><span className="auth-kicker">{mode === 'register' ? 'НОВЫЙ АККАУНТ' : 'С ВОЗВРАЩЕНИЕМ'}</span><h2>{mode === 'register' ? 'Присоединяйтесь к Mostor' : 'Войдите в Mostor'}</h2><p>{mode === 'register' ? 'Создайте отдельный профиль и публикуйте в общей ленте.' : 'Продолжайте с того места, где остановились.'}</p><form onSubmit={submit}>{mode === 'register' && <label className="field">Имя<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Как вас зовут?" autoComplete="name" /></label>}<label className="field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" /></label><label className="field">Пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Минимум 6 символов" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>{error && <p className="auth-error">{error}</p>}<button className="primary auth-submit" disabled={loading}>{loading ? 'Подождите...' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}</button></form><button className="auth-switch" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}>{mode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}</button></div></section></main>
}

function PostComposer({ profile, channels, close, onCreate }) {
  const [text, setText] = useState('')
  const [channelId, setChannelId] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  useEffect(() => {
    if (!file) return setPreview('')
    const url = URL.createObjectURL(file); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const publish = async () => {
    if (!text.trim() && !file) return
    let fileId = ''
    let mediaUrl = ''
    if (file) { fileId = crypto.randomUUID(); await putFile(fileId, file) }
    if (file && file.size <= 700000) mediaUrl = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file) })
    await onCreate({ id: crypto.randomUUID(), text: text.trim(), fileId, mediaUrl, mediaType: file?.type.startsWith('video') ? 'video' : file ? 'image' : '', channelId, createdAt: Date.now(), likes: 0 })
    close()
  }
  return <Modal title="Новая публикация" close={close} wide><div className="composer-head"><Avatar profile={profile} /><div><b>{profile.name}</b><small>@{profile.username}</small></div></div><textarea className="big-input" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Что происходит?" />{preview && <div className="post-preview">{file.type.startsWith('video') ? <video src={preview} controls /> : <img src={preview} alt="" />}<button onClick={() => setFile(null)}><X /></button></div>}<div className="modal-row"><label className="file-button"><Image size={18} />Фото или видео<input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} /></label><select value={channelId} onChange={(e) => setChannelId(e.target.value)}><option value="">Личная лента</option>{channels.map((channel) => <option value={channel.id} key={channel.id}>#{channel.name}</option>)}</select><button className="primary" disabled={!text.trim() && !file} onClick={publish}>Опубликовать</button></div></Modal>
}

function StoriesSection({ stories, profile, createStory }) {
  const [composer, setComposer] = useState(false)
  const [viewing, setViewing] = useState(null)
  return <><section className="stories-bar"><button className="story-bubble own" onClick={() => setComposer(true)}><span><Avatar profile={{ ...profile, uid: '' }} size={58} /><i><Plus /></i></span><small>Моя история</small></button>{stories.map((story) => <button className="story-bubble" onClick={() => setViewing(story)} key={story.id}><span><Avatar profile={{ ...story.author, uid: '' }} size={58} /></span><small>{story.author?.name}</small></button>)}</section>{composer && <StoryComposer close={() => setComposer(false)} createStory={createStory} profile={profile} />}{viewing && <StoryViewer story={viewing} close={() => setViewing(null)} />}</>
}

function StoryComposer({ close, createStory, profile }) {
  const [text, setText] = useState('')
  const [media, setMedia] = useState(null)
  const [color, setColor] = useState('#5537b8')
  const [preview, setPreview] = useState('')
  useEffect(() => { if (!media) return setPreview(''); const url = URL.createObjectURL(media); setPreview(url); return () => URL.revokeObjectURL(url) }, [media])
  const publish = async () => {
    if (!text.trim() && !media) return
    let mediaData = '', mediaType = ''
    if (media) {
      if (media.size > 550 * 1024) { window.alert('Для бесплатной истории файл должен быть меньше 550 КБ. Выберите короткое видео или небольшое фото.'); return }
      mediaData = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(media) }); mediaType = media.type.startsWith('video') ? 'video' : 'image'
    }
    await createStory({ text: text.trim(), mediaData, mediaType, color, author: profile }); close()
  }
  return <Modal title="Новая история" close={close}><div className="story-compose-preview" style={{ background: media?.type.startsWith('image') && preview ? `url(${preview}) center/cover` : color }}>{media?.type.startsWith('video') ? <video src={preview} controls playsInline /> : <p>{text || 'Ваша история'}</p>}</div><textarea className="story-text-input" value={text} onChange={(event) => setText(event.target.value)} maxLength="180" placeholder="Напишите что-нибудь..." /><div className="story-tools"><label><Image />Фото<input hidden type="file" accept="image/*" onChange={(event) => setMedia(event.target.files[0])} /></label><label><Video />Короткое видео<input hidden type="file" accept="video/*" onChange={(event) => setMedia(event.target.files[0])} /></label><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></div><small className="story-limit">Фото или видео до 550 КБ. История исчезнет через 24 часа.</small><button className="primary full" disabled={!text.trim() && !media} onClick={publish}>Опубликовать</button></Modal>
}

function StoryViewer({ story, close }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => { const timer = setInterval(() => setProgress((value) => { if (value >= 100) { close(); return 100 } return value + 1 }), 60); return () => clearInterval(timer) }, [story.id])
  return <div className="story-viewer" onClick={close}><div className="story-card" style={{ background: story.mediaType === 'image' ? `url(${story.mediaData}) center/cover` : story.color }} onClick={(event) => event.stopPropagation()}><i><em style={{ width: `${progress}%` }} /></i><header><Avatar profile={{ ...story.author, uid: '' }} /><div><b>{story.author?.name}</b><small>{new Date(story.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</small></div><button onClick={close}><X /></button></header>{story.mediaType === 'video' && <video src={story.mediaData} autoPlay muted loop playsInline controls />}<p>{story.text}</p></div></div>
}

function Media({ fileId, mediaUrl, type, controls = false }) {
  const url = useFileUrl(fileId)
  const source = mediaUrl || url
  if (!source) return <div className="media-loading">Медиа доступно только на устройстве автора</div>
  return type === 'video' ? <video className="post-media" src={source} controls={controls} /> : <img className="post-media" src={source} alt="" />
}

function ReactionBar({ reactions = {}, onReact }) {
  const options = ['👍', '❤️', '🔥', '😂', '👏']
  return <div className="reaction-bar">{options.map((emoji) => <button className={reactions[emoji] ? 'selected' : ''} onClick={() => onReact(emoji)} key={emoji}>{emoji}{reactions[emoji] ? <span>{reactions[emoji]}</span> : null}</button>)}</div>
}

function PostCard({ post, profile, channel, onDelete, discussion, onComment, reactions, onReact, saved, onSave, canDelete }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const submit = (event) => { event.preventDefault(); if (!text.trim()) return; onComment(post.id, text.trim()); setText('') }
  return <article className="post-card panel"><header><Avatar profile={profile} /><div><b>{profile.name}</b><small>@{profile.username} · {new Date(post.createdAt).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div>{canDelete && <button onClick={() => onDelete(post)}><Trash2 size={17} /></button>}</header>{channel && <span className="channel-tag">#{channel.name}</span>}<p>{post.text}</p>{(post.fileId || post.mediaUrl) && <Media fileId={post.fileId} mediaUrl={post.mediaUrl} type={post.mediaType} controls={post.mediaType === 'video'} />}<ReactionBar reactions={reactions} onReact={(emoji) => onReact(post.id, emoji)} /><footer><button onClick={() => onReact(post.id, '❤️')}><Heart size={20} fill={reactions['❤️'] ? 'currentColor' : 'none'} />{Object.values(reactions).reduce((sum, value) => sum + value, 0)}</button><button className={open ? 'active' : ''} onClick={() => setOpen(!open)}><MessageCircle size={20} />{discussion.length}</button><button onClick={() => navigator.clipboard?.writeText(post.text)}><Send size={19} />Поделиться</button><button className={saved ? 'saved' : ''} onClick={() => onSave(post.id)}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} /></button></footer>{open && <section className="post-discussion"><h4>Обсуждение</h4>{discussion.length === 0 && <p className="discussion-empty">Начните обсуждение этой публикации.</p>}{discussion.map((item) => <article key={item.id}><Avatar profile={item.author || profile} size={33} /><div><b>{item.author?.name || profile.name}</b><small>{new Date(item.createdAt).toLocaleString('ru')}</small><p>{item.text}</p></div></article>)}<form onSubmit={submit}><Avatar profile={profile} size={34} /><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Написать комментарий..." /><button><Send size={17} /></button></form></section>}</article>
}

function FeedPage({ data, update, openComposer, posts, currentUid, deletePost }) {
  const addComment = (postId, text) => update({ postDiscussions: { ...data.postDiscussions, [postId]: [...(data.postDiscussions[postId] || []), { id: crypto.randomUUID(), text, createdAt: Date.now(), author: data.profile }] } })
  const react = (postId, emoji) => { const current = data.postReactions[postId] || {}; update({ postReactions: { ...data.postReactions, [postId]: { ...current, [emoji]: current[emoji] ? 0 : 1 } } }) }
  const save = (postId) => update({ savedPosts: data.savedPosts.includes(postId) ? data.savedPosts.filter((id) => id !== postId) : [...data.savedPosts, postId] })
  return <main className="feed-layout"><section className="feed-column"><div className="feed-intro"><div><span className="eyebrow">ОБЩАЯ ЛЕНТА</span><h2>Посты всего Mostor.</h2></div><button className="primary" onClick={openComposer}><Plus />Добавить пост</button></div>{posts.length === 0 ? <Empty icon={Home} title="Лента пока пустая" text="Создайте первую публикацию, которую увидят все зарегистрированные пользователи." action={openComposer} actionText="Добавить первый пост" /> : posts.map((post) => <PostCard post={post} profile={post.author || data.profile} channel={data.channels.find((item) => item.id === post.channelId)} onDelete={deletePost} canDelete={post.uid === currentUid} discussion={data.postDiscussions[post.id] || []} onComment={addComment} reactions={data.postReactions[post.id] || {}} onReact={react} saved={data.savedPosts.includes(post.id)} onSave={save} key={post.id} />)}</section><aside className="feed-rail"><section className="panel quick-card"><h3>Быстрый старт</h3><button onClick={openComposer}><Plus />Новая публикация</button><p>Публикации синхронизируются через Firebase и видны другим пользователям.</p></section><section className="panel stats-card"><span><b>{posts.length}</b>постов</span><span><b>{data.friends.length}</b>друзей</span><span><b>{data.savedPosts.length}</b>сохранено</span></section></aside></main>
}

function ChannelsPage({ data, update }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const create = () => { if (!name.trim()) return; update({ channels: [...data.channels, { id: crypto.randomUUID(), name: name.trim(), description: '', joined: true, members: 1 }] }); setName(''); setOpen(false) }
  const toggleJoin = (channel) => update({ channels: data.channels.map((item) => item.id === channel.id ? { ...item, joined: !item.joined, members: Math.max(0, (item.members || 0) + (item.joined ? -1 : 1)) } : item) })
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">СООБЩЕСТВА</span><h2>Каналы</h2><p>Вступайте в сообщества и публикуйте материалы по темам.</p></div><button className="primary" onClick={() => setOpen(true)}><Plus />Создать канал</button></div>{data.channels.length === 0 ? <Empty icon={Users} title="Каналов еще нет" text="Создайте первый канал для новостей, игр, музыки или своей команды." action={() => setOpen(true)} actionText="Создать канал" /> : <div className="channel-grid">{data.channels.map((channel) => <article className="channel-card panel" key={channel.id}><span>#</span><h3>{channel.name}</h3><p>{data.posts.filter((post) => post.channelId === channel.id).length} публикаций · {channel.members || 0} участников</p><div className="channel-actions"><button className={channel.joined ? 'joined' : 'join'} onClick={() => toggleJoin(channel)}>{channel.joined ? <><Check size={16} />Вы участник</> : <><UserPlus size={16} />Вступить</>}</button><button className="delete-channel" onClick={() => update({ channels: data.channels.filter((item) => item.id !== channel.id) })}><Trash2 size={16} /></button></div></article>)}</div>}{open && <Modal title="Новый канал" close={() => setOpen(false)}><label className="field">Название<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Разработка" /></label><button className="primary full" onClick={create}>Создать канал</button></Modal>}</main>
}

function VideosPage({ data, update, selectedVideo, setSelectedVideo, currentUser, remoteVideos }) {
  const input = useRef(null)
  const [progress, setProgress] = useState(0)
  const upload = async (file) => {
    if (!file) return
    const id = crypto.randomUUID(); const path = `videos/${currentUser.uid}/${id}-${file.name}`
    const task = uploadBytesResumable(storageRef(storage, path), file)
    task.on('state_changed', (snapshot) => setProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)), () => setProgress(0), async () => {
      const url = await getDownloadURL(task.snapshot.ref)
      await setDoc(doc(db, 'videos', id), { title: file.name.replace(/\.[^.]+$/, ''), size: file.size, type: file.type, url, path, uid: currentUser.uid, author: data.profile, createdAt: serverTimestamp() })
      setProgress(0)
    })
  }
  const remove = async (video) => { if (video.uid !== currentUser.uid) return; await deleteObject(storageRef(storage, video.path)); await deleteDoc(doc(db, 'videos', video.id)) }
  const current = remoteVideos.find((video) => video.id === selectedVideo)
  if (current) return <VideoPlayerPage video={current} videos={remoteVideos} profile={data.profile} engagement={data.videoEngagement || {}} update={update} close={() => setSelectedVideo('')} select={setSelectedVideo} />
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">ВИДЕОХОСТИНГ</span><h2>Видео Mostor</h2><p>Большие ролики хранятся в Firebase Storage и доступны всем пользователям.</p></div><button className="primary" onClick={() => input.current.click()}><Upload />Загрузить видео</button><input ref={input} hidden type="file" accept="video/*" onChange={(e) => upload(e.target.files[0])} /></div>{progress > 0 && <div className="upload-progress panel"><span>Загрузка видео</span><i><em style={{ width: `${progress}%` }} /></i><b>{progress}%</b></div>}{remoteVideos.length === 0 ? <Empty icon={Video} title="Видео пока нет" text="Загрузите первый большой ролик в общее хранилище Mostor." action={() => input.current.click()} actionText="Загрузить первое видео" /> : <div className="video-grid">{remoteVideos.map((video) => <VideoCard video={video} remove={remove} canDelete={video.uid === currentUser.uid} open={() => setSelectedVideo(video.id)} key={video.id} />)}</div>}</main>
}

function VideoCard({ video, remove, open, canDelete }) {
  return <article className="video-card panel"><button className="video-cover" onClick={open}><video src={video.url} muted preload="metadata" /><span><Play fill="currentColor" /></span></button><div><button className="video-title" onClick={open}><h3>{video.title}</h3><small>{video.author?.name} · {formatBytes(video.size)}</small></button>{canDelete && <button onClick={() => remove(video)}><Trash2 size={16} /></button>}</div></article>
}

function VideoPlayerPage({ video, videos, profile, engagement, update, close, select }) {
  const url = video.url
  const [comment, setComment] = useState('')
  const details = engagement[video.id] || { likes: 0, liked: false, comments: [] }
  const saveDetails = (next) => update({ videoEngagement: { ...engagement, [video.id]: next } })
  const toggleLike = () => saveDetails({ ...details, liked: !details.liked, likes: Math.max(0, details.likes + (details.liked ? -1 : 1)) })
  const submitComment = (event) => {
    event.preventDefault()
    if (!comment.trim()) return
    saveDetails({ ...details, comments: [...details.comments, { id: crypto.randomUUID(), text: comment.trim(), createdAt: Date.now() }] })
    setComment('')
  }
  const recommended = videos.filter((item) => item.id !== video.id)
  return <main className="watch-page"><button className="watch-back" onClick={close}><ArrowLeft />Все видео</button><div className="watch-layout"><section className="watch-main"><div className="player-shell">{url ? <video key={video.id} src={url} controls autoPlay playsInline /> : <div className="media-loading">Загрузка видео...</div>}</div><div className="watch-info"><div><h2>{video.title}</h2><p>{new Date(video.createdAt).toLocaleDateString('ru')} · {formatBytes(video.size)}</p></div><button className={details.liked ? 'watch-like liked' : 'watch-like'} onClick={toggleLike}><Heart fill={details.liked ? 'currentColor' : 'none'} />{details.likes}</button></div><section className="video-comments panel"><h3>Комментарии <span>{details.comments.length}</span></h3><form onSubmit={submitComment}><Avatar profile={profile} size={39} /><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Оставить комментарий..." /><button><Send size={18} /></button></form>{details.comments.length === 0 ? <p className="no-comments">Комментариев пока нет. Будьте первым.</p> : <div className="video-comment-list">{details.comments.map((item) => <article key={item.id}><Avatar profile={profile} size={36} /><div><b>{profile.name}</b><small>{new Date(item.createdAt).toLocaleString('ru')}</small><p>{item.text}</p></div></article>)}</div>}</section></section><aside className="recommendations"><h3>Рекомендуем также посмотреть</h3>{recommended.length === 0 ? <div className="recommend-empty"><Film /><p>Загрузите еще видео, и они появятся здесь.</p></div> : recommended.map((item) => <RecommendedVideo video={item} select={select} key={item.id} />)}</aside></div></main>
}

function RecommendedVideo({ video, select }) {
  const url = video.url
  return <button className="recommended-video" onClick={() => { select(video.id); window.scrollTo(0, 0) }}><span><video src={url} muted preload="metadata" /><i><Play size={16} fill="currentColor" /></i></span><div><b>{video.title}</b><small>{formatBytes(video.size)}</small></div></button>
}

function FriendsPage({ data, update, openChat }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const add = () => { if (!name.trim()) return; update({ friends: [...data.friends, { id: crypto.randomUUID(), name: name.trim() }] }); setName(''); setOpen(false) }
  const remove = (id) => { const chats = { ...data.chats }; delete chats[id]; update({ friends: data.friends.filter((friend) => friend.id !== id), chats }) }
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">КОНТАКТЫ</span><h2>Друзья</h2><p>Добавляйте контакты и начинайте локальную переписку.</p></div><button className="primary" onClick={() => setOpen(true)}><UserPlus />Добавить друга</button></div>{data.friends.length === 0 ? <Empty icon={UserPlus} title="Список друзей пуст" text="Добавьте первый контакт. Для него автоматически станет доступен диалог." action={() => setOpen(true)} actionText="Добавить друга" /> : <div className="friends-grid">{data.friends.map((friend) => <article className="friend-card panel" key={friend.id}><Avatar profile={friend} size={58} /><div><h3>{friend.name}</h3><small>Локальный контакт</small></div><button onClick={() => openChat(friend.id)}><MessageCircle size={18} />Написать</button><button className="danger" onClick={() => remove(friend.id)}><Trash2 size={17} /></button></article>)}</div>}{open && <Modal title="Добавить друга" close={() => setOpen(false)}><label className="field">Имя<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя друга" /></label><button className="primary full" onClick={add}>Добавить</button></Modal>}</main>
}

function NetworkMessagesPage({ data, update, users, currentUser, initialFriend, stickerPacks }) {
  const contacts = users.filter((user) => user.uid !== currentUser.uid)
  const [selected, setSelected] = useState(initialFriend || contacts[0]?.uid || '')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [call, setCall] = useState(null)
  const [incoming, setIncoming] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [attachmentError, setAttachmentError] = useState('')
  const [recording, setRecording] = useState(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [circlePreview, setCirclePreview] = useState(null)
  const [stickersOpen, setStickersOpen] = useState(false)
  const [viewedStickerPack, setViewedStickerPack] = useState(null)
  const fileInput = useRef(null)
  const recorderRef = useRef(null)
  const contact = contacts.find((user) => user.uid === selected)
  const chatId = selected ? [currentUser.uid, selected].sort().join('_') : ''

  useEffect(() => { if (!selected && contacts[0]) setSelected(contacts[0].uid) }, [contacts.length])
  useEffect(() => { if (initialFriend) setSelected(initialFriend) }, [initialFriend])
  useEffect(() => {
    if (!chatId) { setMessages([]); return }
    return onSnapshot(query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')), (snapshot) => {
      const serverMessages = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), time: item.data().createdAt?.toMillis?.() || Date.now() }))
      setMessages((current) => {
        const serverIds = new Set(serverMessages.map((message) => message.id))
        return [...serverMessages, ...current.filter((message) => message.pending && !serverIds.has(message.id))].sort((a, b) => a.time - b.time)
      })
    }, (error) => { if (error.code !== 'permission-denied') console.error(error) })
  }, [chatId])
  useEffect(() => {
    if (!chatId) return
    messages.filter((message) => message.senderId !== currentUser.uid && !message.readBy?.includes(currentUser.uid)).forEach((message) => updateDoc(doc(db, 'chats', chatId, 'messages', message.id), { readBy: arrayUnion(currentUser.uid) }).catch(() => {}))
  }, [chatId, messages.length, currentUser.uid])
  useEffect(() => onSnapshot(query(collection(db, 'calls'), where('calleeId', '==', currentUser.uid), where('status', '==', 'ringing')), (snapshot) => {
    const item = snapshot.docs[0]
    setIncoming(item ? { id: item.id, ...item.data() } : null)
  }, (error) => { if (error.code !== 'permission-denied') console.error(error) }), [currentUser.uid])
  useEffect(() => {
    if (!incoming) return
    navigator.vibrate?.([400, 250, 400, 800])
    let context
    let interval
    try {
      context = new (window.AudioContext || window.webkitAudioContext)()
      const ring = () => [659, 784, 988].forEach((frequency, index) => { const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .25); oscillator.connect(gain).connect(context.destination); oscillator.start(context.currentTime + index * .18); oscillator.stop(context.currentTime + index * .18 + .3) })
      ring(); interval = setInterval(ring, 1800)
    } catch {}
    return () => { clearInterval(interval); context?.close(); navigator.vibrate?.(0) }
  }, [incoming?.id])

  const send = async (event) => {
    event.preventDefault()
    if (!text.trim() || !contact) return
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'))
    const message = { id: messageRef.id, text: text.trim(), senderId: currentUser.uid, author: data.profile.name, time: Date.now(), readBy: [currentUser.uid], pending: true }
    setMessages((items) => [...items.filter((item) => item.id !== message.id), message]); setText('')
    try { const replied = [...messages].reverse().find((item) => item.senderId === contact.uid && !item.repliedBy?.includes(currentUser.uid)); if (replied) await updateDoc(doc(db, 'chats', chatId, 'messages', replied.id), { repliedBy: arrayUnion(currentUser.uid) }); await setDoc(doc(db, 'chats', chatId), { members: [currentUser.uid, contact.uid], updatedAt: serverTimestamp(), lastMessage: message.text }, { merge: true }); await setDoc(messageRef, { text: message.text, senderId: currentUser.uid, author: data.profile.name, createdAt: serverTimestamp(), readBy: [currentUser.uid], repliedBy: [] }) }
    catch (error) { setMessages((items) => items.filter((item) => item.id !== message.id)); window.alert(`Не удалось отправить сообщение: ${error.message}`) }
  }
  const attachFile = async (file) => {
    if (!file || !contact) return
    setAttachmentError('')
    if (file.size > 600 * 1024) { setAttachmentError('Файл слишком большой. Бесплатный лимит: 600 КБ.'); window.alert('Файл слишком большой. Бесплатный лимит: 600 КБ.'); fileInput.current.value = ''; return }
    setUploadProgress(25)
    const fileUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) })
    setUploadProgress(70)
    const messageRef = doc(collection(db, 'chats', chatId, 'messages')); const attachment = { name: file.name, size: file.size, type: file.type, url: fileUrl }
    setMessages((items) => [...items, { id: messageRef.id, text: '', senderId: currentUser.uid, author: data.profile.name, attachment, time: Date.now(), pending: true }])
    await setDoc(doc(db, 'chats', chatId), { members: [currentUser.uid, contact.uid], updatedAt: serverTimestamp(), lastMessage: `Файл: ${file.name}` }, { merge: true })
    await setDoc(messageRef, { text: '', senderId: currentUser.uid, author: data.profile.name, attachment, createdAt: serverTimestamp(), readBy: [currentUser.uid] })
    setUploadProgress(100); setTimeout(() => setUploadProgress(0), 350); fileInput.current.value = ''
  }
  const sendMediaBlob = async (blob, kind) => {
    if (!contact) return
    if (!blob.size) { window.alert('Запись пустая. Попробуйте еще раз.'); return }
    if (blob.size > 580 * 1024) { window.alert('Запись получилась слишком большой. Запишите короче.'); return }
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let binary = ''
      for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
      const base64 = btoa(binary)
      const messageRef = doc(collection(db, 'chats', chatId, 'messages')); const mediaMessage = { kind, type: blob.type, base64, size: blob.size }
      setMessages((items) => [...items, { id: messageRef.id, text: '', senderId: currentUser.uid, author: data.profile.name, mediaMessage, time: Date.now(), pending: true }])
      await setDoc(doc(db, 'chats', chatId), { members: [currentUser.uid, contact.uid], updatedAt: serverTimestamp(), lastMessage: kind === 'voice' ? 'Голосовое сообщение' : 'Видеосообщение' }, { merge: true })
      await setDoc(messageRef, { text: '', senderId: currentUser.uid, author: data.profile.name, mediaMessage, createdAt: serverTimestamp(), readBy: [currentUser.uid] })
    } catch (error) { window.alert(error.code === 'permission-denied' ? 'Обновите Firestore Rules для отправки медиа.' : `Не удалось отправить запись: ${error.message}`) }
  }
  const stopRecording = () => { const active = recorderRef.current; if (!active) return; clearInterval(active.timer); if (active.recorder.state === 'recording') active.recorder.stop(); recorderRef.current = null }
  const startRecording = async (kind) => {
    if (recording || !contact) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'circle' ? { width: 320, height: 320, facingMode: 'user' } : false })
      const chunks = []
      const candidates = kind === 'voice' ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'] : ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const options = kind === 'voice' ? { audioBitsPerSecond: 40000 } : { videoBitsPerSecond: 180000, audioBitsPerSecond: 24000 }
      if (mimeType) options.mimeType = mimeType
      const recorder = new MediaRecorder(stream, options)
      recorderRef.current = { recorder, stream, kind, timer: null }
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => window.alert('Браузер не смог записать видео. Используйте скрепку для отправки файла.')
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop()); setRecording(null); setRecordSeconds(0)
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || (kind === 'voice' ? 'audio/webm' : 'video/webm') })
        if (kind === 'circle') {
          if (!blob.size) { window.alert('Камера не записала видео. Попробуйте еще раз.'); return }
          setCirclePreview({ blob, url: URL.createObjectURL(blob) })
        } else await sendMediaBlob(blob, kind)
      }
      recorder.start(250); setRecording(kind); setRecordSeconds(0)
      recorderRef.current.timer = setInterval(() => setRecordSeconds((value) => value + 1), 1000)
      setTimeout(() => { if (recorder.state === 'recording') stopRecording() }, 6000)
    } catch (error) { window.alert(error.name === 'NotAllowedError' ? 'Разрешите Mostor доступ к микрофону и камере.' : `Запись не поддерживается: ${error.message}`) }
  }
  useEffect(() => {
    const form = document.querySelector('.dialog > form')
    if (!form) return
    const picker = form.querySelector('input[type="file"]')
    if (picker) picker.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt,.zip'
    let voice = form.querySelector('.voice-record-button')
    let circle = form.querySelector('.circle-record-button')
    if (!voice) {
      voice = document.createElement('button'); voice.type = 'button'; voice.className = 'voice-record-button'; form.insertBefore(voice, form.querySelector('input:not([type="file"])'))
    }
    if (!circle) {
      circle = document.createElement('button'); circle.type = 'button'; circle.className = 'circle-record-button'; form.insertBefore(circle, form.querySelector('input:not([type="file"])'))
    }
    let sticker = form.querySelector('.sticker-picker-button')
    if (!sticker) { sticker = document.createElement('button'); sticker.type = 'button'; sticker.className = 'sticker-picker-button'; sticker.textContent = '☺'; const attachButton = form.querySelector('button'); attachButton?.after(sticker) }
    let picture = form.querySelector('.picture-picker-button')
    if (!picture) { picture = document.createElement('button'); picture.type = 'button'; picture.className = 'picture-picker-button'; picture.textContent = '▧'; form.insertBefore(picture, form.querySelector('input:not([type="file"])')) }
    sticker.onclick = () => setStickersOpen(true)
    picture.onclick = () => picker?.click()
    voice.textContent = recording === 'voice' ? `■ ${recordSeconds}с` : '🎙'
    circle.textContent = recording === 'circle' ? `■ ${recordSeconds}с` : '●'
    voice.classList.toggle('recording', recording === 'voice')
    circle.classList.toggle('recording', recording === 'circle')
    voice.onclick = () => recording === 'voice' ? stopRecording() : startRecording('voice')
    circle.onclick = () => recording === 'circle' ? stopRecording() : startRecording('circle')
  }, [chatId, recording, recordSeconds, circlePreview, stickersOpen, messages.length])
  const startCall = async (mode) => {
    if (!contact) return
    await setDoc(doc(db, 'chats', chatId), { members: [currentUser.uid, contact.uid], updatedAt: serverTimestamp(), lastMessage: mode === 'video' ? 'Видеозвонок' : 'Звонок' }, { merge: true })
    const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), { text: '', systemType: 'call', mode, senderId: currentUser.uid, createdAt: serverTimestamp(), readBy: [currentUser.uid] })
    const callRef = await addDoc(collection(db, 'calls'), { callerId: currentUser.uid, caller: data.profile, calleeId: contact.uid, callee: contact, mode, status: 'ringing', chatId, messageId: messageRef.id, createdAt: serverTimestamp() })
    setCall({ id: callRef.id, mode, target: contact, role: 'caller' })
  }
  const sendSticker = async (pack, sticker) => {
    if (!contact) return
    const messageRef = doc(collection(db, 'chats', chatId, 'messages'))
    const payload = { packId: pack.id, id: sticker.id, image: sticker.image || '', data: sticker.data || '', type: sticker.type || 'image', shape: sticker.shape || 'square', name: sticker.name || pack.name }
    setMessages((items) => [...items, { id: messageRef.id, senderId: currentUser.uid, author: data.profile.name, sticker: payload, time: Date.now(), readBy: [currentUser.uid], repliedBy: [], pending: true }]); setStickersOpen(false)
    await setDoc(doc(db, 'chats', chatId), { members: [currentUser.uid, contact.uid], updatedAt: serverTimestamp(), lastMessage: 'Стикер' }, { merge: true })
    await setDoc(messageRef, { text: '', senderId: currentUser.uid, author: data.profile.name, sticker: payload, createdAt: serverTimestamp(), readBy: [currentUser.uid], repliedBy: [] })
  }
  const openStickerPack = (packId) => { const pack = stickerPacks.find((item) => item.id === packId); if (pack) setViewedStickerPack(pack) }
  useEffect(() => { const open = (event) => openStickerPack(event.detail); window.addEventListener('mostor:sticker-pack', open); return () => window.removeEventListener('mostor:sticker-pack', open) }, [stickerPacks])
  const addStickerPack = async (packId) => { const current = data.profile.stickerPacks || []; if (current.includes(packId)) return; const next = [...current, packId]; update({ profile: { ...data.profile, stickerPacks: next } }); await setDoc(doc(db, 'users', currentUser.uid), { stickerPacks: next }, { merge: true }); setViewedStickerPack(null) }
  const acceptCall = () => { setCall({ id: incoming.id, mode: incoming.mode, target: incoming.caller, role: 'callee' }); setIncoming(null) }
  const rejectCall = async () => { await updateDoc(doc(db, 'calls', incoming.id), { status: 'missed', endedAt: serverTimestamp() }); if (incoming.chatId && incoming.messageId) await updateDoc(doc(db, 'chats', incoming.chatId, 'messages', incoming.messageId), { systemType: 'missed' }); setIncoming(null) }

  if (circlePreview) return <Modal title="Предпросмотр кружка" close={() => { URL.revokeObjectURL(circlePreview.url); setCirclePreview(null) }}><div className="circle-preview"><video src={circlePreview.url} controls autoPlay loop muted playsInline onError={() => window.alert('Браузер не может воспроизвести запись. Переснимите кружок или отправьте видео через скрепку.')} /><p>Проверьте, что видео снялось, затем отправьте.</p><div><button className="secondary" onClick={() => { URL.revokeObjectURL(circlePreview.url); setCirclePreview(null); setTimeout(() => startRecording('circle'), 0) }}>Переснять</button><button className="primary" onClick={async () => { await sendMediaBlob(circlePreview.blob, 'circle'); URL.revokeObjectURL(circlePreview.url); setCirclePreview(null) }}><Send />Отправить</button></div></div></Modal>
  if (stickersOpen) { const owned = stickerPacks.filter((pack) => data.profile.stickerPacks?.includes(pack.id)); return <Modal title="Стикеры" close={() => setStickersOpen(false)} wide>{owned.length === 0 ? <div className="notification-empty"><Smile /><p>Добавьте стикерпак в разделе «Стикеры».</p></div> : <div className="chat-sticker-picker">{owned.map((pack) => <section key={pack.id}><h3>{pack.name}</h3><div>{pack.stickers.map((item) => <button onClick={() => sendSticker(pack, item)} key={item.id}><StickerAsset sticker={item} /></button>)}</div></section>)}</div>}</Modal> }
  if (viewedStickerPack) { const added = data.profile.stickerPacks?.includes(viewedStickerPack.id); return <Modal title="Стикерпак" close={() => setViewedStickerPack(null)} wide><div className="viewed-sticker-pack"><header><div><h2>{viewedStickerPack.name}</h2><p>Автор: {viewedStickerPack.author?.name}</p></div><button className={added ? 'secondary' : 'primary'} disabled={added} onClick={() => addStickerPack(viewedStickerPack.id)}>{added ? <><Check />Уже добавлен</> : <><Plus />Добавить себе</>}</button></header><div>{viewedStickerPack.stickers.map((item) => <StickerAsset sticker={item} key={item.id} />)}</div></div></Modal> }

  return <><main className="messages-shell panel"><aside><div className="chat-sidebar-title"><h2>Люди</h2></div>{contacts.length === 0 && <p className="no-conversations">Пока нет других зарегистрированных пользователей.</p>}{contacts.map((user) => <button className={selected === user.uid ? 'active' : ''} onClick={() => setSelected(user.uid)} key={user.uid}><Avatar profile={user} /><span><b>{user.name}</b><small>@{user.username}</small></span></button>)}</aside>{contact ? <section className="dialog"><header><Avatar profile={contact} /><div><b>{contact.name}</b><small>аккаунт Mostor</small></div><button className="call-start" onClick={() => startCall('audio')}><Phone size={18} /></button><button className="call-start" onClick={() => startCall('video')}><Video size={19} /></button></header><div className="message-list">{messages.length === 0 && <div className="dialog-empty"><MessageCircle /><p>Напишите первое сообщение</p></div>}{messages.map((message) => <ChatMessage message={message} mine={message.senderId === currentUser.uid} key={message.id} />)}</div>{uploadProgress > 0 && <div className="chat-upload"><i><em style={{ width: `${uploadProgress}%` }} /></i><span>{uploadProgress}%</span></div>}<form onSubmit={send}><button type="button" onClick={() => fileInput.current.click()}><Paperclip /></button><input ref={fileInput} hidden type="file" onChange={(event) => attachFile(event.target.files[0])} /><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Сообщение..." /><button className="send"><Send /></button></form></section> : <section className="dialog-placeholder"><MessageCircle /><h3>Выберите пользователя</h3></section>}</main>{incoming && <div className="incoming-call"><Avatar profile={incoming.caller} size={70} /><div><span>Входящий {incoming.mode === 'video' ? 'видеозвонок' : 'звонок'}</span><h3>{incoming.caller?.name}</h3></div><button className="accept" onClick={acceptCall}><Phone /></button><button className="reject" onClick={rejectCall}><PhoneOff /></button></div>}{call && <WebRTCCall call={call} currentUser={currentUser} close={() => setCall(null)} />}</>
}

function ChatMessage({ message, mine }) {
  const attachment = message.attachment
  const media = message.mediaMessage
  const callText = message.systemType === 'missed' ? 'Пропущенный звонок' : mine ? 'Исходящий звонок' : 'Входящий звонок'
  const delivery = mine ? (message.repliedBy?.length ? '✓✓✓' : message.readBy?.length > 1 ? '✓✓' : '✓') : ''
  return <div className={mine ? 'message mine' : 'message'}>{message.systemType && <b className="system-message-icon">{message.systemType === 'missed' ? <PhoneOff /> : <Phone />}{callText}{message.mode === 'video' && ' · видео'}</b>}{!message.systemType && message.text}{message.sticker && <button className="chat-sticker-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent('mostor:sticker-pack', { detail: message.sticker.packId }))}><StickerAsset sticker={message.sticker} className={`chat-sticker ${message.sticker.shape || 'square'}`} /><span>Открыть стикерпак</span></button>}{attachment && (attachment.type?.startsWith('image/') ? <a className="chat-image" href={attachment.url} target="_blank" rel="noreferrer"><img src={attachment.url} alt={attachment.name} /><span>{attachment.name}</span></a> : attachment.type?.startsWith('video/') ? <video className="chat-video" src={attachment.url} controls playsInline /> : <a className="chat-file" href={attachment.url} target="_blank" rel="noreferrer"><FolderOpen /><span><b>{attachment.name}</b><small>{formatBytes(attachment.size)}</small></span><Download /></a>)}{media?.kind === 'voice' && <MediaAudio media={media} />}{media?.kind === 'circle' && <CircleMessage media={media} />}<small>{new Date(message.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}{delivery && <b className="delivery-checks">{delivery}</b>}</small></div>
}

async function mediaToBlob(media) {
  if (media.base64) {
    const binary = atob(media.base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return new Blob([bytes], { type: media.type || 'application/octet-stream' })
  }
  const response = await fetch(media.url)
  return response.blob()
}

function MediaAudio({ media }) {
  const [source, setSource] = useState('')
  useEffect(() => { let url = ''; mediaToBlob(media).then((blob) => { url = URL.createObjectURL(blob); setSource(url) }); return () => { if (url) URL.revokeObjectURL(url) } }, [media.base64, media.url])
  return source ? <audio className="voice-message" src={source} controls preload="metadata" /> : <span>Загрузка голосового...</span>
}

function CircleMessage({ media }) {
  const video = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let objectUrl = ''
    const prepare = async () => {
      try {
        const blob = await mediaToBlob(media)
        objectUrl = URL.createObjectURL(blob)
        setSource(objectUrl)
      } catch (reason) { setError(`Не удалось подготовить видео: ${reason.message}`) }
    }
    prepare()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [media.base64, media.url])
  const toggle = async () => { if (!video.current || !source) return; try { if (video.current.paused) await video.current.play(); else video.current.pause() } catch (reason) { setError(`Ошибка воспроизведения: ${reason.message}`) } }
  return <button className={`circle-player ${playing ? 'playing' : ''} ${error ? 'failed' : ''}`} onClick={toggle}>{source && <video ref={video} src={source} playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError(`Не декодирован ${media.type || 'неизвестный формат'}, ${formatBytes(media.size)}`)} />}<span>{error ? <X /> : playing ? <Pause /> : <Play fill="currentColor" />}</span>{error && <small>{error}</small>}</button>
}

function CallsPage({ calls, users, currentUser, profile }) {
  const [filter, setFilter] = useState('all')
  const [activeCall, setActiveCall] = useState(null)
  const visible = calls.filter((call) => filter === 'all' || call.status === 'missed')
  const startAgain = async (entry, mode) => {
    const targetId = entry.callerId === currentUser.uid ? entry.calleeId : entry.callerId
    const target = users.find((user) => user.uid === targetId)
    if (!target) return
    const callRef = await addDoc(collection(db, 'calls'), { callerId: currentUser.uid, caller: profile, calleeId: target.uid, callee: target, mode, status: 'ringing', createdAt: serverTimestamp() })
    setActiveCall({ id: callRef.id, mode, target, role: 'caller' })
  }
  return <><main className="content-page"><div className="page-heading"><div><span className="eyebrow">СВЯЗЬ</span><h2>Звонки</h2><p>История аудио- и видеовызовов Mostor.</p></div></div><div className="call-filters"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Все</button><button className={filter === 'missed' ? 'active' : ''} onClick={() => setFilter('missed')}>Пропущенные</button></div>{visible.length === 0 ? <Empty icon={Phone} title="История звонков пуста" text="Начните аудио- или видеозвонок из раздела сообщений." /> : <div className="call-history panel">{visible.map((entry) => { const outgoing = entry.callerId === currentUser.uid; const person = outgoing ? entry.callee : entry.caller; return <article key={entry.id}><Avatar profile={person} size={48} /><div><b>{person?.name || 'Пользователь'}</b><span className={entry.status === 'missed' ? 'missed' : ''}>{entry.status === 'missed' ? <PhoneOff /> : outgoing ? <Phone /> : <Phone />} {entry.status === 'missed' ? 'Пропущенный' : outgoing ? 'Исходящий' : 'Входящий'} · {entry.mode === 'video' ? 'видео' : 'аудио'}</span><small>{new Date(entry.createdAt).toLocaleString('ru')}</small></div><button onClick={() => startAgain(entry, 'audio')}><Phone /></button><button onClick={() => startAgain(entry, 'video')}><Video /></button></article> })}</div>}</main>{activeCall && <WebRTCCall call={activeCall} currentUser={currentUser} close={() => setActiveCall(null)} />}</>
}

function WebRTCCall({ call, currentUser, close }) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(call.mode === 'audio')
  const [status, setStatus] = useState('Подключение...')
  const localVideo = useRef(null)
  const remoteVideo = useRef(null)

  useEffect(() => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] })
    const callRef = doc(db, 'calls', call.id)
    const localCandidates = collection(callRef, call.role === 'caller' ? 'callerCandidates' : 'calleeCandidates')
    const remoteCandidates = collection(callRef, call.role === 'caller' ? 'calleeCandidates' : 'callerCandidates')
    const remote = new MediaStream(); setRemoteStream(remote)
    peer.ontrack = (event) => event.streams[0].getTracks().forEach((track) => remote.addTrack(track))
    peer.onconnectionstatechange = () => setStatus(peer.connectionState === 'connected' ? 'Соединение установлено' : peer.connectionState)
    peer.onicecandidate = (event) => { if (event.candidate) addDoc(localCandidates, event.candidate.toJSON()) }
    let stream
    navigator.mediaDevices.getUserMedia({ audio: true, video: call.mode === 'video' }).then(async (media) => {
      stream = media; setLocalStream(media); media.getTracks().forEach((track) => peer.addTrack(track, media))
      if (call.role === 'caller') {
        const offer = await peer.createOffer(); await peer.setLocalDescription(offer); await updateDoc(callRef, { offer: { type: offer.type, sdp: offer.sdp } })
      } else {
        const snapshot = await getDoc(callRef); const offer = snapshot.data().offer
        if (!offer) { setStatus('Ожидание предложения...'); return }
        await peer.setRemoteDescription(offer); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); await updateDoc(callRef, { answer: { type: answer.type, sdp: answer.sdp }, status: 'active' })
      }
    }).catch(() => setStatus('Нет доступа к камере или микрофону'))
    const unsubCall = onSnapshot(callRef, async (snapshot) => {
      const value = snapshot.data(); if (!value) return
      if (call.role === 'caller' && value.answer && !peer.currentRemoteDescription) await peer.setRemoteDescription(value.answer)
      if (value.status === 'ended' || value.status === 'rejected') close()
    })
    const unsubCandidates = onSnapshot(remoteCandidates, (snapshot) => snapshot.docChanges().forEach((change) => { if (change.type === 'added') peer.addIceCandidate(change.doc.data()) }))
    return () => { unsubCall(); unsubCandidates(); stream?.getTracks().forEach((track) => track.stop()); peer.close() }
  }, [call.id])
  useEffect(() => { if (localVideo.current && localStream) localVideo.current.srcObject = localStream }, [localStream])
  useEffect(() => { if (remoteVideo.current && remoteStream) remoteVideo.current.srcObject = remoteStream }, [remoteStream])
  const finish = async () => { await updateDoc(doc(db, 'calls', call.id), { status: 'ended' }); close() }
  const toggleMute = () => { localStream?.getAudioTracks().forEach((track) => { track.enabled = muted }); setMuted(!muted) }
  const toggleVideo = () => { localStream?.getVideoTracks().forEach((track) => { track.enabled = videoOff }); setVideoOff(!videoOff) }
  return <div className="call-overlay"><div className="call-stage"><video className="remote-call-video" ref={remoteVideo} autoPlay playsInline />{call.mode === 'video' && <video className="local-call-video" ref={localVideo} autoPlay muted playsInline />} {!remoteStream?.active && <div className="call-avatar"><Avatar profile={call.target} size={112} /><h2>{call.target.name}</h2><p>{status}</p></div>}<div className="call-meta"><span>{call.mode === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}</span><b>{status}</b></div><div className="call-controls"><button className={muted ? 'off' : ''} onClick={toggleMute}>{muted ? <MicOff /> : <Mic />}</button>{call.mode === 'video' && <button className={videoOff ? 'off' : ''} onClick={toggleVideo}>{videoOff ? <VideoOff /> : <Video />}</button>}<button className="hangup" onClick={finish}><PhoneOff /></button></div></div></div>
}

function MessagesPage({ data, update, initialFriend }) {
  const conversations = [
    ...data.friends.map((friend) => ({ ...friend, kind: 'friend', chatKey: friend.id, subtitle: 'Личный чат' })),
    ...(data.chatGroups || []).map((group) => ({ ...group, kind: 'group', chatKey: `group:${group.id}`, subtitle: `${group.members?.length || 1} участников` })),
  ]
  const [selected, setSelected] = useState(initialFriend || conversations[0]?.chatKey || '')
  const [text, setText] = useState('')
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [call, setCall] = useState(null)
  useEffect(() => { if (initialFriend) setSelected(initialFriend) }, [initialFriend])
  const current = conversations.find((item) => item.chatKey === selected)
  const isGroup = current?.kind === 'group'
  const messages = isGroup ? (data.groupChats?.[current.id] || []) : (data.chats[selected] || [])
  const send = (e) => { e.preventDefault(); if (!text.trim() || !selected) return; const message = { id: crypto.randomUUID(), text: text.trim(), mine: true, author: data.profile.name, time: Date.now() }; if (isGroup) update({ groupChats: { ...(data.groupChats || {}), [current.id]: [...messages, message] } }); else update({ chats: { ...data.chats, [selected]: [...messages, message] } }); setText('') }
  const createGroup = () => { if (!groupName.trim()) return; const group = { id: crypto.randomUUID(), name: groupName.trim(), members: [data.profile.name, ...data.friends.map((friend) => friend.name)] }; update({ chatGroups: [...(data.chatGroups || []), group] }); setSelected(`group:${group.id}`); setGroupName(''); setGroupOpen(false) }
  const reactMessage = (messageId, emoji) => { const key = `${selected}:${messageId}`; const currentReactions = data.messageReactions[key] || {}; update({ messageReactions: { ...data.messageReactions, [key]: { ...currentReactions, [emoji]: currentReactions[emoji] ? 0 : 1 } } }) }
  return <><main className="messages-shell panel"><aside><div className="chat-sidebar-title"><h2>Чаты</h2><button onClick={() => setGroupOpen(true)}><Plus /></button></div>{conversations.length === 0 && <p className="no-conversations">Создайте групповой чат или добавьте друга.</p>}{conversations.map((item) => { const list = item.kind === 'group' ? (data.groupChats?.[item.id] || []) : (data.chats[item.id] || []); return <button className={selected === item.chatKey ? 'active' : ''} onClick={() => setSelected(item.chatKey)} key={item.chatKey}><Avatar profile={item} /><span><b>{item.name}</b><small>{list.at(-1)?.text || item.subtitle}</small></span></button> })}</aside>{current ? <section className="dialog"><header><Avatar profile={current} /><div><b>{current.name}</b><small>{current.subtitle}</small></div><button className="call-start" onClick={() => setCall({ mode: 'audio', target: current })}><Phone size={18} /></button><button className="call-start" onClick={() => setCall({ mode: 'video', target: current })}><Video size={19} /></button></header><div className="message-list">{messages.length === 0 && <div className="dialog-empty"><MessageCircle /><p>Напишите первое сообщение</p></div>}{messages.map((message) => <div className="message-wrap" key={message.id}><div className={message.mine ? 'message mine' : 'message'}>{isGroup && <b className="message-author">{message.author}</b>}{message.text}<small>{new Date(message.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</small></div><ReactionBar reactions={data.messageReactions[`${selected}:${message.id}`] || {}} onReact={(emoji) => reactMessage(message.id, emoji)} /></div>)}</div><form onSubmit={send}><button type="button"><Paperclip /></button><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение..." /><button className="send"><Send /></button></form></section> : <section className="dialog-placeholder"><MessageCircle /><h3>Выберите или создайте чат</h3><button className="primary" onClick={() => setGroupOpen(true)}><Plus />Новый групповой чат</button></section>}</main>{groupOpen && <Modal title="Новый групповой чат" close={() => setGroupOpen(false)}><label className="field">Название чата<input autoFocus value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Например: Наша команда" /></label><p className="group-hint">В чат будут добавлены текущие друзья: {data.friends.length}</p><button className="primary full" onClick={createGroup}>Создать чат</button></Modal>}{call && <CallOverlay call={call} close={(duration, status) => { update({ callHistory: [{ id: crypto.randomUUID(), target: call.target.name, mode: call.mode, duration, status, createdAt: Date.now() }, ...data.callHistory] }); setCall(null) }} />}</>
}

function CallOverlay({ call, close }) {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(call.mode === 'audio')
  const [seconds, setSeconds] = useState(0)
  const videoRef = useRef(null)
  useEffect(() => {
    let media
    navigator.mediaDevices?.getUserMedia({ audio: true, video: call.mode === 'video' }).then((result) => { media = result; setStream(result) }).catch(() => setError('Нет доступа к камере или микрофону'))
    return () => media?.getTracks().forEach((track) => track.stop())
  }, [])
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream }, [stream])
  useEffect(() => { if (!stream) return; const timer = setInterval(() => setSeconds((value) => value + 1), 1000); return () => clearInterval(timer) }, [stream])
  const toggleMute = () => { stream?.getAudioTracks().forEach((track) => { track.enabled = muted }); setMuted(!muted) }
  const toggleVideo = () => { stream?.getVideoTracks().forEach((track) => { track.enabled = videoOff }); setVideoOff(!videoOff) }
  const finish = () => { stream?.getTracks().forEach((track) => track.stop()); close(seconds, error ? 'Ошибка' : 'Завершен') }
  return <div className="call-overlay"><div className="call-stage">{call.mode === 'video' && stream && !videoOff ? <video ref={videoRef} autoPlay muted playsInline /> : <div className="call-avatar"><Avatar profile={call.target} size={112} /><h2>{call.target.name}</h2><p>{error || (stream ? 'Соединение установлено' : 'Подключение...')}</p></div>}<div className="call-meta"><span>{call.mode === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}</span><b>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</b></div><div className="call-controls"><button className={muted ? 'off' : ''} onClick={toggleMute}>{muted ? <MicOff /> : <Mic />}</button>{call.mode === 'video' && <button className={videoOff ? 'off' : ''} onClick={toggleVideo}>{videoOff ? <VideoOff /> : <Video />}</button>}<button className="hangup" onClick={finish}><PhoneOff /></button></div></div></div>
}

function CloudPage({ data, update, currentUser, remoteFiles }) {
  const input = useRef(null)
  const [progress, setProgress] = useState(0)
  const upload = async (files) => {
    for (const file of files) {
      const id = crypto.randomUUID(); const path = `files/${currentUser.uid}/${id}-${file.name}`
      const task = uploadBytesResumable(storageRef(storage, path), file)
      await new Promise((resolve, reject) => task.on('state_changed', (snapshot) => setProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)), reject, async () => { const url = await getDownloadURL(task.snapshot.ref); await setDoc(doc(db, 'files', id), { uid: currentUser.uid, name: file.name, size: file.size, type: file.type, path, url, createdAt: serverTimestamp() }); resolve() }))
    }
    setProgress(0)
  }
  const download = (file) => { const link = document.createElement('a'); link.href = file.url; link.download = file.name; link.target = '_blank'; link.click() }
  const remove = async (file) => { await deleteObject(storageRef(storage, file.path)); await deleteDoc(doc(db, 'files', file.id)) }
  const used = remoteFiles.reduce((sum, file) => sum + file.size, 0)
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">MOSTOR CLOUD</span><h2>Облако</h2><p>Большие файлы хранятся в Firebase Storage и доступны с ваших устройств.</p></div><button className="primary" onClick={() => input.current.click()}><Upload />Загрузить файлы</button><input ref={input} hidden multiple type="file" onChange={(e) => upload([...e.target.files])} /></div>{progress > 0 && <div className="upload-progress panel"><span>Загрузка файла</span><i><em style={{ width: `${progress}%` }} /></i><b>{progress}%</b></div>}<div className="storage-meter panel"><HardDrive /><div><span><b>{formatBytes(used)}</b> занято</span><i><em style={{ width: `${Math.min(100, used / 104857600 * 100)}%` }} /></i><small>Личное Firebase-хранилище</small></div></div>{remoteFiles.length === 0 ? <Empty icon={Cloud} title="Облако пустое" text="Загружайте документы, изображения, архивы и другие большие файлы." action={() => input.current.click()} actionText="Загрузить файлы" /> : <div className="file-list panel">{remoteFiles.map((file) => <article key={file.id}><span><FolderOpen /></span><div><b>{file.name}</b><small>{formatBytes(file.size)} · {new Date(file.createdAt).toLocaleDateString('ru')}</small></div><button onClick={() => download(file)}><Download /></button><button onClick={() => remove(file)}><Trash2 /></button></article>)}</div>}</main>
}

function ProfilePage({ data, update, currentUser, users }) {
  const [draft, setDraft] = useState(data.profile)
  const avatarInput = useRef(null)
  const chooseAvatar = (file) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { const image = new window.Image(); image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256; const context = canvas.getContext('2d'); const side = Math.min(image.width, image.height); context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 256, 256); setDraft((value) => ({ ...value, avatar: canvas.toDataURL('image/jpeg', .72) })) }; image.src = reader.result }; reader.readAsDataURL(file) }
  const [error, setError] = useState('')
  const save = async () => {
    const username = (draft.username || '').trim().replace(/^@/, '').replace(/\s/g, '').toLowerCase()
    if (username && users.some((user) => user.uid !== currentUser.uid && user.username?.toLowerCase() === username)) { setError('Этот username уже занят.'); return }
    const profile = { ...draft, uid: currentUser.uid, name: draft.name.trim() || 'Пользователь', username, phone: draft.phone?.trim() || '' }
    try { setError(''); update({ profile }); await updateProfile(currentUser, { displayName: profile.name }); await setDoc(doc(db, 'users', currentUser.uid), profile, { merge: true }) } catch (reason) { setError(`Не удалось сохранить профиль: ${reason.message}`) }
  }
  const toggleSetting = (key) => update({ settings: { ...data.settings, [key]: !data.settings[key] } })
  return <main className="content-page profile-page"><div className="profile-cover"><span>MOSTOR ID</span></div><section className="profile-settings panel"><div className="avatar-editor"><Avatar profile={draft} size={112} /><button onClick={() => avatarInput.current.click()}><Pencil size={17} /></button><input ref={avatarInput} hidden type="file" accept="image/*" onChange={(e) => chooseAvatar(e.target.files[0])} /></div><div className="profile-title"><h2>{draft.name || 'Пользователь'}</h2><p>@{draft.username || 'user'}</p></div><div className="settings-grid"><label className="field">Имя<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label className="field">Имя пользователя<input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} /></label><label className="field full-field">О себе<textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></label></div><div className="profile-actions"><button className="secondary" onClick={() => setDraft({ ...draft, avatar: '' })}>Удалить фото</button><button className="primary" onClick={save}><Save size={18} />Сохранить изменения</button></div></section><section className="preferences panel"><h3>Настройки приложения</h3><div className="preference-grid"><Preference label="Компактный режим" text="Меньше отступов в ленте" active={data.settings.compact} toggle={() => toggleSetting('compact')} /><Preference label="Меньше анимаций" text="Снижает визуальное движение" active={data.settings.reduceMotion} toggle={() => toggleSetting('reduceMotion')} /><Preference label="Автозапуск видео" text="Запускать видео при открытии" active={data.settings.autoplay} toggle={() => toggleSetting('autoplay')} /><Preference label="Звуки интерфейса" text="Звуковые уведомления" active={data.settings.sounds} toggle={() => toggleSetting('sounds')} /><Preference label="Время сообщений" text="Показывать точное время" active={data.settings.timestamps} toggle={() => toggleSetting('timestamps')} /></div></section><section className="profile-dashboard"><article className="panel"><b>{data.savedPosts.length}</b><span>сохраненных постов</span></article><article className="panel"><b>{data.giftInventory.length}</b><span>подарков в коллекции</span></article><article className="panel"><b>{data.callHistory.length}</b><span>звонков</span></article><article className="panel"><b>{data.coins}</b><span>монет</span></article></section>{data.callHistory.length > 0 && <section className="call-history panel"><h3>История звонков</h3>{data.callHistory.slice(0, 8).map((call) => <article key={call.id}>{call.mode === 'video' ? <Video /> : <Phone />}<div><b>{call.target}</b><small>{new Date(call.createdAt).toLocaleString('ru')} · {call.duration} сек.</small></div><span>{call.status}</span></article>)}</section>}</main>
}

function Preference({ label, text, active, toggle }) { return <button className="preference" onClick={toggle}><span><b>{label}</b><small>{text}</small></span><i className={active ? 'active' : ''}><em /></i></button> }

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return { r: parseInt(clean.slice(0, 2), 16) || 0, g: parseInt(clean.slice(2, 4), 16) || 0, b: parseInt(clean.slice(4, 6), 16) || 0 }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Number(value) || 0)).toString(16).padStart(2, '0')).join('')}`
}

function SettingsPage({ data, update }) {
  const settings = data.settings
  const accentRgb = hexToRgb(settings.accent || '#caff3d')
  const backgroundRgb = hexToRgb(settings.background || '#0b0d0b')
  const setSetting = (key, value) => update({ settings: { ...settings, [key]: value } })
  const setRgb = (key, channel, value) => { const current = hexToRgb(settings[key]); current[channel] = value; setSetting(key, rgbToHex(current)) }
  const presets = [
    ['Кислотный', '#caff3d', '#0b0d0b'], ['Океан', '#41c7ff', '#07131a'], ['Закат', '#ff6b45', '#180c0a'], ['Фиолетовый', '#a77aff', '#100b19'], ['Моно', '#ffffff', '#101010'],
  ]
  const reset = () => update({ settings: { ...initialData.settings } })
  return <main className="content-page settings-page"><div className="page-heading"><div><span className="eyebrow">MOSTOR PERSONAL</span><h2>Настройки</h2><p>Настройте интерфейс под себя. Изменения применяются сразу.</p></div><button className="secondary" onClick={reset}>Сбросить</button></div><section className="theme-builder panel"><div className="theme-preview" style={{ '--preview-accent': settings.accent, '--preview-bg': settings.background }}><span>M</span><div><b>Mostor</b><small>Предпросмотр вашей темы</small><button>Акцентная кнопка</button></div></div><div className="theme-controls"><h3>Режим интерфейса</h3><div className="mode-picker"><button className={settings.themeMode === 'dark' ? 'active' : ''} onClick={() => setSetting('themeMode', 'dark')}>Темная</button><button className={settings.themeMode === 'light' ? 'active' : ''} onClick={() => setSetting('themeMode', 'light')}>Светлая</button></div><ColorControl title="Акцентный цвет" value={settings.accent} rgb={accentRgb} setValue={(value) => setSetting('accent', value)} setRgb={(channel, value) => setRgb('accent', channel, value)} /><ColorControl title="Цвет фона" value={settings.background} rgb={backgroundRgb} setValue={(value) => setSetting('background', value)} setRgb={(channel, value) => setRgb('background', channel, value)} /><label className="scale-control"><span><b>Масштаб интерфейса</b><small>{settings.scale}%</small></span><input type="range" min="85" max="115" step="5" value={settings.scale} onChange={(event) => setSetting('scale', Number(event.target.value))} /></label></div></section><section className="theme-presets"><h3>Готовые палитры</h3><div>{presets.map(([name, accent, background]) => <button onClick={() => update({ settings: { ...settings, accent, background, themeMode: 'dark' } })} key={name}><i style={{ background: `linear-gradient(135deg, ${accent} 50%, ${background} 50%)` }} /><span>{name}</span></button>)}</div></section><section className="preferences panel"><h3>Поведение приложения</h3><div className="preference-grid"><Preference label="Компактный режим" text="Меньше отступов" active={settings.compact} toggle={() => setSetting('compact', !settings.compact)} /><Preference label="Меньше анимаций" text="Снизить движение" active={settings.reduceMotion} toggle={() => setSetting('reduceMotion', !settings.reduceMotion)} /><Preference label="Автозапуск видео" text="Проигрывать при открытии" active={settings.autoplay} toggle={() => setSetting('autoplay', !settings.autoplay)} /><Preference label="Звуки интерфейса" text="Рингтоны и сигналы" active={settings.sounds} toggle={() => setSetting('sounds', !settings.sounds)} /><Preference label="Время сообщений" text="Показывать время" active={settings.timestamps} toggle={() => setSetting('timestamps', !settings.timestamps)} /></div></section></main>
}

function ColorControl({ title, value, rgb, setValue, setRgb }) {
  return <div className="color-control"><header><b>{title}</b><label style={{ background: value }}><input type="color" value={value} onChange={(event) => setValue(event.target.value)} /></label><code>{value.toUpperCase()}</code></header><div>{['r', 'g', 'b'].map((channel) => <label key={channel}><span>{channel.toUpperCase()}</span><input type="range" min="0" max="255" value={rgb[channel]} onChange={(event) => setRgb(channel, Number(event.target.value))} /><input type="number" min="0" max="255" value={rgb[channel]} onChange={(event) => setRgb(channel, Number(event.target.value))} /></label>)}</div></div>
}

function IdentityEditor({ data, update, currentUser, users }) {
  const [username, setUsername] = useState(data.profile.username || '')
  const [phone, setPhone] = useState(data.profile.phone || '')
  const [error, setError] = useState('')
  const save = async () => {
    const clean = username.trim().replace(/^@/, '').replace(/\s/g, '').toLowerCase()
    if (clean && users.some((user) => user.uid !== currentUser.uid && user.username?.toLowerCase() === clean)) { setError('Этот username уже занят.'); return }
    const profile = { ...data.profile, uid: currentUser.uid, username: clean, phone: phone.trim() }
    setError(''); update({ profile }); await setDoc(doc(db, 'users', currentUser.uid), profile, { merge: true })
  }
  return <section className="identity-editor panel"><h3>Контакты и адрес профиля</h3><p>Оба поля необязательные. Username должен быть уникальным.</p><div className="settings-grid"><label className="field">Username<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="например, yan" /></label><label className="field">Телефон<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 900 000-00-00" /></label></div>{error && <p className="profile-error">{error}</p>}<button className="primary" onClick={save}><Save />Сохранить контакты</button></section>
}

function ProfileViewer({ person, own, data, update, close, openChat }) {
  const [giftOpen, setGiftOpen] = useState(false)
  const give = (gift) => {
    if (data.coins < gift.price) return
    if (own) update({ coins: data.coins - gift.price, giftInventory: [...data.giftInventory, { instanceId: crypto.randomUUID(), giftId: gift.id, boughtAt: Date.now() }] })
    else update({ coins: data.coins - gift.price, sentGifts: [{ id: crypto.randomUUID(), giftId: gift.id, friendName: person.name, sentAt: Date.now() }, ...data.sentGifts] })
    setGiftOpen(false)
  }
  return <Modal title={own ? 'Мой профиль' : 'Профиль пользователя'} close={close} wide><div className="public-profile"><div className="public-profile-cover" /><Avatar profile={{ ...person, uid: '' }} size={104} /><h2>{person.name}</h2>{person.username && <span>@{person.username}</span>}<StatusBadge profile={person} /><p>{person.bio || 'Пользователь Mostor'}</p>{person.phone && <a href={`tel:${person.phone}`}>{person.phone}</a>}<div className="public-profile-actions">{!own && <button className="primary" onClick={() => { close(); openChat(person.uid) }}><MessageCircle />Написать</button>}<button className="secondary" onClick={() => setGiftOpen(!giftOpen)}><Gift />{own ? 'Купить себе подарок' : 'Подарить'}</button></div>{giftOpen && <div className="profile-gift-grid">{giftCatalog.map((gift) => <button disabled={data.coins < gift.price} onClick={() => give(gift)} key={gift.id}><span>{gift.symbol}</span><b>{gift.name}</b><small>● {gift.price}</small></button>)}</div>}</div></Modal>
}

function StickerAsset({ sticker, className = '', autoPlay = true }) {
  const [source, setSource] = useState('')
  const [playbackError, setPlaybackError] = useState(false)
  const raw = sticker.data || sticker.image || ''
  const video = sticker.type === 'video' || raw.startsWith('data:video/')
  useEffect(() => {
    setPlaybackError(false)
    if (!video || !raw.startsWith('data:')) { setSource(raw); return }
    let objectUrl = ''
    let cancelled = false
    mediaToBlob({ url: raw }).then((blob) => {
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setSource(objectUrl)
    }).catch(() => { if (!cancelled) setPlaybackError(true) })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [raw, video])
  if (video) {
    if (playbackError) return sticker.image ? <img className={className} src={sticker.image} alt={sticker.name || 'Стикер'} /> : <span className={`${className} sticker-loading`}>Видео не воспроизводится</span>
    return source ? <video className={className} src={source} poster={sticker.image || undefined} muted loop playsInline autoPlay={autoPlay} preload="metadata" onError={() => setPlaybackError(true)} /> : <span className={`${className} sticker-loading`}>Загрузка стикера...</span>
  }
  return raw ? <img className={className} src={raw} alt={sticker.name || 'Стикер'} /> : <span className={`${className} sticker-loading`}>Стикер недоступен</span>
}

function StickerWorkshop({ file, close, save }) {
  const [source, setSource] = useState('')
  const [duration, setDuration] = useState(5)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(5)
  const [shape, setShape] = useState('square')
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [busy, setBusy] = useState(false)
  const videoRef = useRef(null)
  const isVideo = file.type.startsWith('video/')
  useEffect(() => { const url = URL.createObjectURL(file); setSource(url); return () => URL.revokeObjectURL(url) }, [file])
  const dimensions = shape === 'long' ? [384, 192] : [256, 256]
  const drawFrame = (context, media, width, height) => {
    context.clearRect(0, 0, width, height)
    const scale = Math.max(width / media.videoWidth, height / media.videoHeight)
    const sourceWidth = width / scale; const sourceHeight = height / scale
    context.drawImage(media, (media.videoWidth - sourceWidth) / 2, (media.videoHeight - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, width, height)
    if (text.trim()) { context.font = `700 ${Math.round(width / 11)}px Manrope`; context.textAlign = 'center'; context.textBaseline = 'bottom'; context.lineWidth = 6; context.strokeStyle = '#000000aa'; context.strokeText(text.trim(), width / 2, height - 15); context.fillStyle = textColor; context.fillText(text.trim(), width / 2, height - 15) }
  }
  const exportImage = async () => {
    if (file.type === 'image/gif') {
      if (file.size > 350 * 1024) throw new Error('GIF больше 350 КБ. Выберите более короткий GIF или видео для обрезки в мастерской.')
      if (text.trim()) throw new Error('Наложение текста на GIF пока не поддерживается: Canvas сохраняет только первый кадр. Уберите текст, чтобы сохранить анимацию.')
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) })
      return { id: crypto.randomUUID(), type: 'image', shape, data, name: file.name }
    }
    const image = new window.Image(); image.src = source; await image.decode()
    const [width, height] = dimensions; const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const context = canvas.getContext('2d')
    const scale = Math.max(width / image.width, height / image.height); const sourceWidth = width / scale; const sourceHeight = height / scale
    context.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, width, height)
    if (text.trim()) { context.font = `700 ${Math.round(width / 11)}px Manrope`; context.textAlign = 'center'; context.textBaseline = 'bottom'; context.lineWidth = 6; context.strokeStyle = '#000000aa'; context.strokeText(text.trim(), width / 2, height - 15); context.fillStyle = textColor; context.fillText(text.trim(), width / 2, height - 15) }
    return { id: crypto.randomUUID(), type: 'image', shape, data: canvas.toDataURL('image/webp', .65), name: file.name }
  }
  const exportVideo = async () => {
    const video = videoRef.current; const [width, height] = dimensions; const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const context = canvas.getContext('2d')
    const mimeType = ['video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type)); if (!mimeType) throw new Error('Видео-стикеры не поддерживаются этим браузером')
    const recorder = new MediaRecorder(canvas.captureStream(12), { mimeType, videoBitsPerSecond: 120000 }); const chunks = []
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    const done = new Promise((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })) })
    video.currentTime = start; video.muted = true; await video.play(); recorder.start(250)
    await new Promise((resolve) => { const render = () => { drawFrame(context, video, width, height); if (video.currentTime >= end || video.ended) { video.pause(); recorder.stop(); resolve(); return } requestAnimationFrame(render) }; render() })
    const blob = await done; if (!blob.size) throw new Error('Видео не записалось. Попробуйте другой файл.')
    if (blob.size > 430 * 1024) throw new Error('Видео получилось слишком большим. Укоротите отрезок.')
    const data = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob) })
    const image = canvas.toDataURL('image/jpeg', .45)
    return { id: crypto.randomUUID(), type: 'video', shape, data, image, name: file.name, duration: end - start }
  }
  const finish = async () => { setBusy(true); try { save(isVideo ? await exportVideo() : await exportImage()) } catch (error) { window.alert(error.message) } finally { setBusy(false) } }
  return <Modal title="Мастерская стикеров" close={close} wide><div className="sticker-workshop"><div className={`sticker-stage ${shape}`}>{isVideo ? <video ref={videoRef} src={source} muted loop playsInline controls onLoadedMetadata={(event) => { const value = Math.min(event.currentTarget.duration || 5, 5); setDuration(event.currentTarget.duration || 5); setEnd(value) }} /> : <img src={source} alt="" />} {text && <strong style={{ color: textColor }}>{text}</strong>}</div><div className="workshop-controls"><h3>Формат</h3><div className="mode-picker"><button className={shape === 'square' ? 'active' : ''} onClick={() => setShape('square')}>Короткий</button><button className={shape === 'long' ? 'active' : ''} onClick={() => setShape('long')}>Длинный</button></div>{isVideo && <><h3>Обрезать видео</h3><label className="trim-control"><span>Начало: {start.toFixed(1)} сек</span><input type="range" min="0" max={Math.max(0, duration - .5)} step=".1" value={start} onChange={(event) => { const value = Number(event.target.value); setStart(value); if (end <= value) setEnd(Math.min(duration, value + .5)) }} /></label><label className="trim-control"><span>Конец: {end.toFixed(1)} сек</span><input type="range" min={start + .3} max={Math.min(duration, start + 5)} step=".1" value={end} onChange={(event) => setEnd(Number(event.target.value))} /></label><small>Максимальная длина: 5 секунд. Видео-стикер будет без звука.</small></>}<label className="field">Текст<input maxLength="28" value={text} onChange={(event) => setText(event.target.value)} placeholder="Добавить надпись" /></label><label className="workshop-color">Цвет текста<input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} /></label><button className="primary full" disabled={busy} onClick={finish}>{busy ? 'Обработка...' : 'Добавить стикер в пак'}</button></div></div></Modal>
}

function StickersPage({ packs, data, update, currentUser }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [stickers, setStickers] = useState([])
  const [editingFile, setEditingFile] = useState(null)
  const owned = data.profile.stickerPacks || []
  const createPack = async () => {
    if (!name.trim() || !stickers.length) return
    const pack = { name: name.trim(), stickers, uid: currentUser.uid, author: { uid: currentUser.uid, name: data.profile.name, username: data.profile.username || '' }, createdAt: serverTimestamp() }
    if (new Blob([JSON.stringify({ ...pack, createdAt: null })]).size > 850000) { window.alert('Стикерпак превышает лимит Firestore. Уменьшите число или размер GIF/видео-стикеров.'); return }
    try { await addDoc(collection(db, 'stickerPacks'), pack); setName(''); setStickers([]); setOpen(false) }
    catch (error) { window.alert(`Не удалось создать стикерпак: ${error.message}`) }
  }
  const togglePack = async (packId) => { const next = owned.includes(packId) ? owned.filter((id) => id !== packId) : [...owned, packId]; const profile = { ...data.profile, stickerPacks: next }; update({ profile }); await setDoc(doc(db, 'users', currentUser.uid), { stickerPacks: next }, { merge: true }) }
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">MOSTOR STICKERS</span><h2>Стикеры</h2><p>Создавайте изображения и видео-стикеры в собственной мастерской.</p></div><button className="primary" onClick={() => setOpen(true)}><Plus />Создать стикерпак</button></div>{packs.length === 0 ? <Empty icon={Smile} title="Стикерпаков пока нет" text="Создайте первый пак из изображений или коротких видео." action={() => setOpen(true)} actionText="Создать пак" /> : <div className="sticker-pack-grid">{packs.map((pack) => <article className="sticker-pack panel" key={pack.id}><header><div><h3>{pack.name}</h3><small>Автор: {pack.author?.name}</small></div><button className={owned.includes(pack.id) ? 'added' : ''} onClick={() => togglePack(pack.id)}>{owned.includes(pack.id) ? <><Check />Добавлен</> : <><Plus />Добавить</>}</button></header><div>{pack.stickers.map((sticker) => <StickerAsset sticker={sticker} key={sticker.id} />)}</div>{pack.uid === currentUser.uid && <button className="delete-pack" onClick={() => deleteDoc(doc(db, 'stickerPacks', pack.id))}><Trash2 />Удалить пак</button>}</article>)}</div>}{open && <Modal title="Новый стикерпак" close={() => setOpen(false)} wide><label className="field">Название<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Название пака" /></label><label className="sticker-upload"><Film /><span>Открыть мастерскую: фото или видео</span><input hidden type="file" accept="image/*,video/*" onChange={(event) => setEditingFile(event.target.files[0])} /></label>{stickers.length > 0 && <div className="sticker-preview-grid">{stickers.map((sticker) => <div className={sticker.shape} key={sticker.id}><StickerAsset sticker={sticker} /><button onClick={() => setStickers((items) => items.filter((item) => item.id !== sticker.id))}><X /></button></div>)}</div>}<small className="story-limit">До 6 стикеров. Видео до 5 секунд и 430 КБ.</small><button className="primary full" disabled={!name.trim() || !stickers.length} onClick={createPack}>Опубликовать стикерпак</button></Modal>}{editingFile && <StickerWorkshop file={editingFile} close={() => setEditingFile(null)} save={(sticker) => { if (stickers.length >= 6) window.alert('В паке может быть не больше 6 стикеров.'); else setStickers((items) => [...items, sticker]); setEditingFile(null) }} />}</main>
}

function LabsPage({ data, update }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('Все')
  const flags = data.labFlags || {}
  const filtered = labFeatures.filter((feature) => (group === 'Все' || feature.group === group) && feature.name.toLowerCase().includes(query.toLowerCase()))
  const enabled = labFeatures.filter((feature) => flags[feature.id]).length
  const toggle = (id) => update({ labFlags: { ...flags, [id]: !flags[id] } })
  const setVisible = (value) => update({ labFlags: { ...flags, ...Object.fromEntries(filtered.map((feature) => [feature.id, value])) } })
  return <main className="content-page labs-page"><div className="labs-hero"><div><span className="eyebrow">MOSTOR LABS</span><h2>100 новых возможностей</h2><p>Экспериментальные функции для ленты, общения, звонков, видео, игр и безопасности. Настройки сохраняются на устройстве.</p></div><div className="labs-counter"><b>{enabled}</b><span>из 100<br />включено</span></div></div><div className="labs-toolbar panel"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти функцию" /></label><select value={group} onChange={(event) => setGroup(event.target.value)}><option>Все</option>{labGroups.map(([name]) => <option key={name}>{name}</option>)}</select><button onClick={() => setVisible(true)}><Check />Включить видимые</button><button onClick={() => setVisible(false)}><X />Выключить видимые</button></div><div className="labs-grid">{filtered.map((feature, index) => <button className={`lab-card panel ${flags[feature.id] ? 'enabled' : ''}`} onClick={() => toggle(feature.id)} key={feature.id}><span>{String(labFeatures.indexOf(feature) + 1).padStart(3, '0')}</span><div><small>{feature.group}</small><h3>{feature.name}</h3><p>{flags[feature.id] ? 'Функция включена' : 'Нажмите, чтобы включить'}</p></div><i><em /></i></button>)}</div></main>
}

function GiftsPage({ data, update }) {
  const [tab, setTab] = useState('market')
  const [sending, setSending] = useState(null)
  const [friendId, setFriendId] = useState('')
  const buy = (gift) => {
    if (data.coins < gift.price) return
    update({ coins: data.coins - gift.price, giftInventory: [...data.giftInventory, { instanceId: crypto.randomUUID(), giftId: gift.id, boughtAt: Date.now() }] })
  }
  const send = () => {
    const friend = data.friends.find((item) => item.id === friendId)
    if (!sending || !friend) return
    update({ giftInventory: data.giftInventory.filter((item) => item.instanceId !== sending.instanceId), sentGifts: [{ id: crypto.randomUUID(), giftId: sending.giftId, friendName: friend.name, sentAt: Date.now() }, ...data.sentGifts] })
    setSending(null); setFriendId('')
  }
  return <main className="content-page gifts-page"><div className="page-heading"><div><span className="eyebrow">MOSTOR MARKET</span><h2>Подарки</h2><p>Собирайте коллекцию и отправляйте подарки друзьям.</p></div><CoinBalance value={data.coins} /></div><div className="market-tabs"><button className={tab === 'market' ? 'active' : ''} onClick={() => setTab('market')}><ShoppingBag />Рынок</button><button className={tab === 'inventory' ? 'active' : ''} onClick={() => setTab('inventory')}><Gift />Коллекция <span>{data.giftInventory.length}</span></button><button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}><Send />Отправленные</button></div>{tab === 'market' && <div className="gift-grid">{giftCatalog.map((gift) => <GiftCard gift={gift} disabled={data.coins < gift.price} action={() => buy(gift)} actionText={data.coins < gift.price ? 'Не хватает' : 'Купить'} price key={gift.id} />)}</div>}{tab === 'inventory' && (data.giftInventory.length === 0 ? <Empty icon={Gift} title="Коллекция пустая" text="Купите первый подарок на рынке. Затем его можно отправить другу." action={() => setTab('market')} actionText="Открыть рынок" /> : <div className="gift-grid">{data.giftInventory.map((item) => <GiftCard gift={giftCatalog.find((gift) => gift.id === item.giftId)} action={() => setSending(item)} actionText="Подарить другу" key={item.instanceId} />)}</div>)}{tab === 'sent' && (data.sentGifts.length === 0 ? <Empty icon={Send} title="Подарков еще не отправляли" text="Выберите подарок из своей коллекции и отправьте его другу." /> : <div className="sent-gifts panel">{data.sentGifts.map((item) => { const gift = giftCatalog.find((entry) => entry.id === item.giftId); return <article key={item.id}><span className={`sent-gift-icon ${gift.color}`}>{gift.symbol}</span><div><b>{gift.name}</b><small>Для {item.friendName} · {new Date(item.sentAt).toLocaleDateString('ru')}</small></div><Check /></article> })}</div>)}{sending && <Modal title="Отправить подарок" close={() => setSending(null)}><div className="send-gift-preview"><span>{giftCatalog.find((item) => item.id === sending.giftId)?.symbol}</span><b>{giftCatalog.find((item) => item.id === sending.giftId)?.name}</b></div>{data.friends.length === 0 ? <p className="group-hint">Сначала добавьте хотя бы одного друга.</p> : <label className="field">Получатель<select value={friendId} onChange={(event) => setFriendId(event.target.value)}><option value="">Выберите друга</option>{data.friends.map((friend) => <option value={friend.id} key={friend.id}>{friend.name}</option>)}</select></label>}<button className="primary full" disabled={!friendId} onClick={send}>Отправить подарок</button></Modal>}</main>
}

function GiftCard({ gift, disabled, action, actionText, price = false }) {
  return <article className={`gift-card panel ${gift.color}`}><div className="gift-art"><span>{gift.symbol}</span></div><small>{gift.rarity}</small><h3>{gift.name}</h3><button disabled={disabled} onClick={action}>{price && <b>● {gift.price}</b>}{actionText}</button></article>
}

function CoinBalance({ value }) { return <div className="coin-balance"><span>●</span><div><b>{value}</b><small>монет</small></div></div> }

const quests = [
  { id: 'reaction20', title: 'Молниеносная реакция', text: 'Наберите 20 очков в «Импульсе»', reward: 120, progress: (stats) => Math.min(stats.reactionBest, 20), goal: 20 },
  { id: 'tictac3', title: 'Три партии', text: 'Завершите 3 партии в крестики-нолики', reward: 100, progress: (stats) => Math.min(stats.tictacGames, 3), goal: 3 },
  { id: 'memory1', title: 'Идеальная память', text: 'Полностью соберите все пары', reward: 180, progress: (stats) => Math.min(stats.memoryWins, 1), goal: 1 },
]

function GamesPage({ data, update }) {
  const [game, setGame] = useState('reaction')
  const stats = data.gameStats || initialData.gameStats
  const claims = data.questClaims || []
  const setStats = (patch) => update({ gameStats: { ...stats, ...patch } })
  const claim = (quest) => { if (claims.includes(quest.id) || quest.progress(stats) < quest.goal) return; update({ coins: data.coins + quest.reward, questClaims: [...claims, quest.id] }) }
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">MOSTOR PLAY</span><h2>Игры</h2><p>Играйте, выполняйте задания и зарабатывайте монеты.</p></div><CoinBalance value={data.coins} /></div><section className="quests-panel panel"><div className="quests-title"><Trophy /><div><h3>Задания</h3><p>Награды можно получить один раз.</p></div></div><div className="quest-list">{quests.map((quest) => { const progress = quest.progress(stats); const claimed = claims.includes(quest.id); return <article key={quest.id}><div><b>{quest.title}</b><small>{quest.text}</small><i><em style={{ width: `${progress / quest.goal * 100}%` }} /></i><span>{progress} / {quest.goal}</span></div><button disabled={progress < quest.goal || claimed} onClick={() => claim(quest)}>{claimed ? <><Check />Получено</> : <>● {quest.reward}</>}</button></article> })}</div></section><div className="game-tabs"><button className={game === 'reaction' ? 'active' : ''} onClick={() => setGame('reaction')}><Zap />Импульс</button><button className={game === 'tictac' ? 'active' : ''} onClick={() => setGame('tictac')}># Крестики-нолики</button><button className={game === 'memory' ? 'active' : ''} onClick={() => setGame('memory')}><Gamepad2 />Пары</button></div>{game === 'reaction' && <ReactionGame onFinish={(score) => setStats({ reactionBest: Math.max(stats.reactionBest, score) })} />}{game === 'tictac' && <TicTacToe onFinish={() => setStats({ tictacGames: stats.tictacGames + 1 })} />}{game === 'memory' && <MemoryGame onFinish={() => setStats({ memoryWins: stats.memoryWins + 1 })} />}</main>
}

function ReactionGame({ onFinish }) {
  const [score, setScore] = useState(0), [time, setTime] = useState(10), [playing, setPlaying] = useState(false)
  useEffect(() => { if (!playing) return; if (time === 0) { setPlaying(false); onFinish(score); return }; const timer = setTimeout(() => setTime(time - 1), 1000); return () => clearTimeout(timer) }, [playing, time])
  const start = () => { setScore(0); setTime(10); setPlaying(true) }
  return <section className="game-stage panel"><div><span className="eyebrow">СКОРОСТЬ</span><h3>Заряд импульса</h3><p>Нажимайте на ядро как можно быстрее за 10 секунд.</p><div className="scores"><b>{score}<small>очков</small></b><b>{time}<small>секунд</small></b></div></div><button className={`pulse-core ${playing ? 'playing' : ''}`} onClick={() => playing ? setScore(score + 1) : start()}><Zap fill="currentColor" /><b>{playing ? '+1' : time === 0 ? 'ЕЩЕ' : 'СТАРТ'}</b></button></section>
}

function TicTacToe({ onFinish }) {
  const [cells, setCells] = useState(Array(9).fill('')), [turn, setTurn] = useState('X')
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  const winner = lines.find(([a,b,c]) => cells[a] && cells[a] === cells[b] && cells[a] === cells[c])
  const play = (index) => { if (cells[index] || winner) return; const next = [...cells]; next[index] = turn; setCells(next); setTurn(turn === 'X' ? 'O' : 'X') }
  const reset = () => { if (winner || cells.every(Boolean)) onFinish(); setCells(Array(9).fill('')); setTurn('X') }
  return <section className="board-game panel"><div><span className="eyebrow">ДЛЯ ДВОИХ</span><h3>{winner ? `Победил ${cells[winner[0]]}` : cells.every(Boolean) ? 'Ничья' : `Ходит ${turn}`}</h3><button className="secondary" onClick={reset}>Новая партия</button></div><div className="tic-board">{cells.map((cell, index) => <button className={cell.toLowerCase()} onClick={() => play(index)} key={index}>{cell}</button>)}</div></section>
}

function MemoryGame({ onFinish }) {
  const icons = ['M','O','S','T','O','R','M','R','S','T']
  const [cards, setCards] = useState(() => icons.map((value, index) => ({ id: index, value, open: false, done: false })).sort(() => Math.random() - .5))
  const [locked, setLocked] = useState(false)
  const [rewarded, setRewarded] = useState(false)
  useEffect(() => { if (!rewarded && cards.every((card) => card.done)) { setRewarded(true); onFinish() } }, [cards, rewarded])
  const flip = (id) => {
    if (locked) return
    const card = cards.find((item) => item.id === id); if (card.open || card.done) return
    const next = cards.map((item) => item.id === id ? { ...item, open: true } : item); setCards(next)
    const open = next.filter((item) => item.open && !item.done)
    if (open.length === 2) { setLocked(true); setTimeout(() => { setCards((current) => current.map((item) => open.some((selected) => selected.id === item.id) ? { ...item, open: false, done: open[0].value === open[1].value } : item)); setLocked(false) }, 650) }
  }
  const reset = () => { setRewarded(false); setCards(icons.map((value, index) => ({ id: index, value, open: false, done: false })).sort(() => Math.random() - .5)) }
  return <section className="board-game panel"><div><span className="eyebrow">ПАМЯТЬ</span><h3>{cards.every((card) => card.done) ? 'Все пары найдены!' : 'Найдите пары'}</h3><button className="secondary" onClick={reset}>Перемешать</button></div><div className="memory-board">{cards.map((card) => <button className={card.open || card.done ? 'open' : ''} onClick={() => flip(card.id)} key={card.id}><span>{card.value}</span></button>)}</div></section>
}

function formatBytes(bytes) { if (!bytes) return '0 Б'; const units = ['Б','КБ','МБ','ГБ']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}` }

export default function App() {
  const [data, update] = useStoredData()
  const [currentUser, setCurrentUser] = useState(undefined)
  const [sharedPosts, setSharedPosts] = useState([])
  const [networkUsers, setNetworkUsers] = useState([])
  const [musicTracks, setMusicTracks] = useState([])
  const [stickerPacks, setStickerPacks] = useState([])
  const [stories, setStories] = useState([])
  const [outgoingCalls, setOutgoingCalls] = useState([])
  const [incomingCalls, setIncomingCalls] = useState([])
  const [active, setActive] = useState('feed')
  const [searchQuery, setSearchQuery] = useState('')
  const [menu, setMenu] = useState(false)
  const [composer, setComposer] = useState(false)
  const [chatFriend, setChatFriend] = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [viewedProfile, setViewedProfile] = useState(null)
  useEffect(() => {
    const viewport = window.visualViewport
    const updateHeight = () => document.documentElement.style.setProperty('--app-height', `${viewport?.height || window.innerHeight}px`)
    updateHeight()
    viewport?.addEventListener('resize', updateHeight)
    window.addEventListener('resize', updateHeight)
    return () => { viewport?.removeEventListener('resize', updateHeight); window.removeEventListener('resize', updateHeight) }
  }, [])
  useEffect(() => {
    const showProfile = (event) => setViewedProfile(event.detail)
    window.addEventListener('mostor:profile', showProfile)
    return () => window.removeEventListener('mostor:profile', showProfile)
  }, [])
  const navigate = (page) => { setActive(page); setMenu(false); window.scrollTo(0, 0) }
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user || null)
    if (!user) return
    const snapshot = await getDoc(doc(db, 'users', user.uid))
    if (snapshot.exists()) update({ profile: { ...initialData.profile, ...snapshot.data(), uid: user.uid } })
    else { const profile = { uid: user.uid, name: user.displayName || 'Пользователь', username: '', phone: '', email: user.email, avatar: user.photoURL || '', bio: 'Новый пользователь Mostor', statusMode: 'online', statusText: '' }; await setDoc(doc(db, 'users', user.uid), profile); update({ profile }) }
  }), [])
  useEffect(() => {
    if (!currentUser) { setSharedPosts([]); return }
    return onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), (snapshot) => { const server = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: item.data().createdAt?.toMillis?.() || Date.now() })); setSharedPosts((current) => { const ids = new Set(server.map((item) => item.id)); return [...current.filter((item) => item.pending && !ids.has(item.id)), ...server] }) }, (error) => { if (error.code !== 'permission-denied') console.error(error) })
  }, [currentUser])
  useEffect(() => {
    if (!currentUser) return
    const mapCalls = (snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: item.data().createdAt?.toMillis?.() || Date.now() }))
    const handleError = (error) => { if (error.code !== 'permission-denied') console.error(error) }
    const unsubOutgoing = onSnapshot(query(collection(db, 'calls'), where('callerId', '==', currentUser.uid)), (snapshot) => setOutgoingCalls(mapCalls(snapshot)), handleError)
    const unsubIncoming = onSnapshot(query(collection(db, 'calls'), where('calleeId', '==', currentUser.uid)), (snapshot) => setIncomingCalls(mapCalls(snapshot)), handleError)
    return () => { unsubOutgoing(); unsubIncoming() }
  }, [currentUser])
  useEffect(() => {
    if (!currentUser) return
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => setNetworkUsers(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }))), (error) => { if (error.code !== 'permission-denied') console.error(error) })
    const ignoreDenied = (error) => { if (error.code !== 'permission-denied') console.error(error) }
    const unsubMusic = onSnapshot(query(collection(db, 'music'), orderBy('createdAt', 'desc')), (snapshot) => { const server = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: item.data().createdAt?.toMillis?.() || Date.now() })); setMusicTracks((current) => { const ids = new Set(server.map((item) => item.id)); return [...current.filter((item) => item.pending && !ids.has(item.id)), ...server] }) }, ignoreDenied)
    const unsubStickers = onSnapshot(query(collection(db, 'stickerPacks'), orderBy('createdAt', 'desc')), (snapshot) => setStickerPacks(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), ignoreDenied)
    const unsubStories = onSnapshot(query(collection(db, 'stories'), orderBy('createdAt', 'desc')), (snapshot) => { const cutoff = Date.now() - 24 * 60 * 60 * 1000; const server = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: item.data().createdAt?.toMillis?.() || Date.now() })).filter((story) => story.createdAt > cutoff); setStories((current) => { const ids = new Set(server.map((item) => item.id)); return [...current.filter((item) => item.pending && !ids.has(item.id)), ...server] }) }, ignoreDenied)
    return () => { unsubUsers(); unsubMusic(); unsubStickers(); unsubStories() }
  }, [currentUser])
  const createPost = async (post) => {
    const postRef = doc(collection(db, 'posts')); const { id, fileId, ...publicPost } = post
    const optimistic = { ...publicPost, id: postRef.id, uid: currentUser.uid, author: data.profile, createdAt: Date.now(), pending: true }
    setSharedPosts((items) => [optimistic, ...items.filter((item) => item.id !== optimistic.id)])
    try { await setDoc(postRef, { ...publicPost, uid: currentUser.uid, author: data.profile, createdAt: serverTimestamp() }) }
    catch (error) { setSharedPosts((items) => items.filter((item) => item.id !== optimistic.id)); window.alert(`Не удалось опубликовать пост: ${error.message}`) }
  }
  const deleteSharedPost = async (post) => { if (post.uid === currentUser.uid) await deleteDoc(doc(db, 'posts', post.id)) }
  const createStory = async (story) => { const storyRef = doc(collection(db, 'stories')); const value = { ...story, id: storyRef.id, uid: currentUser.uid, createdAt: Date.now(), pending: true }; setStories((items) => [value, ...items]); try { await setDoc(storyRef, { ...story, uid: currentUser.uid, createdAt: serverTimestamp() }) } catch (error) { setStories((items) => items.filter((item) => item.id !== storyRef.id)); window.alert(`Не удалось добавить историю: ${error.message}`) } }
  const openChat = (id) => { setChatFriend(id); navigate('messages') }
  const titles = Object.fromEntries(navItems.map(([id, title]) => [id, title]))
  if (currentUser === undefined) return <div className="app-loading"><span>M</span><p>Загрузка Mostor...</p></div>
  if (!currentUser) return <AuthScreen />
  const themeStyle = { '--acid': data.settings.accent, '--bg': data.settings.themeMode === 'light' ? '#f3f5ef' : data.settings.background, '--panel': data.settings.themeMode === 'light' ? '#ffffff' : '#141714', '--panel2': data.settings.themeMode === 'light' ? '#e8ece5' : '#1b1f1b', '--line': data.settings.themeMode === 'light' ? '#ced5ca' : '#293029', '--muted': data.settings.themeMode === 'light' ? '#687268' : '#8d968d', '--white': data.settings.themeMode === 'light' ? '#151815' : '#f2f4ed', fontSize: `${data.settings.scale / 100}rem` }
  return <div className={`app-shell theme-${data.settings.themeMode}`} style={themeStyle}>
    <div className={`mobile-drawer ${menu ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && setMenu(false)}><Sidebar active={active} setActive={navigate} profile={data.profile} /></div>
    <Sidebar active={active} setActive={navigate} profile={data.profile} />
    <div className={`workspace ${data.settings.compact ? 'compact' : ''} ${data.settings.reduceMotion ? 'reduce-motion' : ''}`}><Topbar title={titles[active]} query={searchQuery} setQuery={setSearchQuery} openMenu={() => setMenu(true)} profile={data.profile} notifications={data.notifications.filter((item) => !item.read).length} openNotifications={() => setNotificationOpen(true)} />
      {active === 'feed' && <><div className="stories-wrap"><StoriesSection stories={stories} profile={data.profile} createStory={createStory} /></div><FeedPage data={data} update={update} posts={sharedPosts} currentUid={currentUser.uid} deletePost={deleteSharedPost} openComposer={() => setComposer(true)} /></>}
      {active === 'channels' && <ChannelsPage data={data} update={update} />}
      {active === 'video' && <FreeStorageNotice type="video" />}
      {active === 'games' && <GamesPage data={data} update={update} />}
      {active === 'gifts' && <GiftsPage data={data} update={update} />}
      {active === 'messages' && <NetworkMessagesPage data={data} update={update} users={networkUsers} currentUser={currentUser} initialFriend={chatFriend} stickerPacks={stickerPacks} />}
      {active === 'calls' && <CallsPage calls={[...outgoingCalls, ...incomingCalls].sort((a, b) => b.createdAt - a.createdAt)} users={networkUsers} currentUser={currentUser} profile={data.profile} />}
      {active === 'music' && <MusicPage tracks={musicTracks} setTracks={setMusicTracks} data={data} currentUser={currentUser} />}
      {active === 'status' && <StatusPage data={data} update={update} currentUser={currentUser} />}
      {active === 'stickers' && <StickersPage packs={stickerPacks} data={data} update={update} currentUser={currentUser} />}
      {active === 'friends' && <FriendsPage data={data} update={update} openChat={openChat} />}
      {active === 'cloud' && <FreeStorageNotice type="cloud" />}
      {active === 'labs' && <LabsPage data={data} update={update} />}
      {active === 'settings' && <SettingsPage data={data} update={update} />}
      {active === 'profile' && <><ProfilePage data={data} update={update} currentUser={currentUser} users={networkUsers} /><IdentityEditor data={data} update={update} currentUser={currentUser} users={networkUsers} /></>}
    </div>
    <nav className="mobile-nav">{navItems.slice(0, 5).map(([id,,Icon]) => <button className={active === id ? 'active' : ''} onClick={() => navigate(id)} key={id}><Icon /></button>)}</nav>
    {composer && <PostComposer profile={data.profile} channels={data.channels} close={() => setComposer(false)} onCreate={createPost} />}
    {notificationOpen && <Modal title="Уведомления" close={() => setNotificationOpen(false)}>{data.notifications.length === 0 ? <div className="notification-empty"><Bell /><p>Новых уведомлений нет.</p></div> : <div className="notification-list">{data.notifications.map((item) => <article key={item.id}><Bell /><div><b>{item.title}</b><small>{item.text}</small></div></article>)}</div>}</Modal>}
    {viewedProfile && <ProfileViewer person={viewedProfile} own={viewedProfile.uid === currentUser.uid} data={data} update={update} close={() => setViewedProfile(null)} openChat={(id) => { setViewedProfile(null); setChatFriend(id); navigate('messages') }} />}
  </div>
}
