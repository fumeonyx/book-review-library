import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { sampleBooks } from './sampleBooks'
import { adminEmails, isSupabaseConfigured, supabase } from './supabaseClient'

const COVER_BUCKET = 'book-covers'

const emptyForm = {
  title: '',
  author: '',
  genre: 'Детективы',
  status: 'Прочитано',
  is_favorite: false,
  read_date: '',
  cover_url: '',
  spine_color: '#8f5c45',
  review: '',
  quote: '',
  rating_total: 0,
  rating_plot: '',
  rating_characters: '',
  rating_style: '',
  rating_ending: '',
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatScore(value) {
  if (value === '' || value === null || value === undefined) return '—'
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return '—'
  return Number.isInteger(number) ? String(number) : String(number).replace('.', ',')
}

function StarRating({ value }) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return <span className="starsText">—</span>
  return (
    <span className="stars" aria-label={`${formatScore(numeric)} из 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = numeric >= star ? 'full' : numeric >= star - 0.5 ? 'half' : 'empty'
        return (
          <span key={star} className={`star star-${fill}`}>
            <span className="starBase">★</span>
            <span className="starFill">★</span>
          </span>
        )
      })}
    </span>
  )
}

function Score({ value }) {
  const score = formatScore(value)
  return (
    <span className="scorePill">
      <StarRating value={value} />
      <span className="scoreValue">{score === '—' ? '—' : `${score}/5`}</span>
    </span>
  )
}

function RatingLine({ label, value }) {
  return (
    <div className="ratingLine">
      <span>{label}</span>
      <Score value={value} />
    </div>
  )
}

function GeneratedCover({ book }) {
  return (
    <div className="generatedCover" style={{ '--coverColor': book.spine_color || '#8f5c45' }}>
      <div className="coverMoon" />
      <div className="coverGlow" />
      <div className="coverTitle">{book.title}</div>
      <div className="coverDivider" />
      <div className="coverAuthor">{book.author}</div>
    </div>
  )
}

function BookCover({ book }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [book?.id, book?.cover_url])
  if (!book?.cover_url || failed) return <GeneratedCover book={book} />
  return <img src={book.cover_url} alt={`Обложка книги ${book.title}`} className="coverImage" onError={() => setFailed(true)} />
}

function BookModal({ book, onClose }) {
  if (!book) return null

  const detailRatings = [
    ['Сюжет', book.rating_plot],
    ['Персонажи', book.rating_characters],
    ['Стиль', book.rating_style],
    ['Концовка', book.rating_ending],
  ]

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <article className="bookModal" onClick={(event) => event.stopPropagation()}>
        <button className="closeButton" onClick={onClose} aria-label="Закрыть">×</button>
        <div className="modalGrid">
          <div className="coverWrap">
            <BookCover book={book} />
          </div>

          <div className="modalContent">
            <p className="eyebrow">{book.genre}</p>
            <h2>{book.title}</h2>
            <p className="author">{book.author}</p>
            {book.read_date && <p className="date">Прочитано: {new Date(book.read_date).toLocaleDateString('ru-RU')}</p>}

            <div className="mainRating">
              <span>Общая оценка</span>
              <Score value={book.rating_total} />
            </div>

            <p className="reviewText">{book.review}</p>

            {book.quote && (
              <blockquote className="quoteBlock">
                <span>Любимая цитата</span>
                “{book.quote}”
              </blockquote>
            )}

            <div className="ratingsBox">
              {detailRatings.map(([label, value]) => <RatingLine key={label} label={label} value={value} />)}
              {detailRatings.every(([, value]) => !numberOrNull(value)) && (
                <p className="ratingHint">Детальные оценки можно заполнить в админ-редактировании.</p>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

function BookSpine({ book, onOpen, index }) {
  const height = 142 + ((book.title.length + book.author.length + index * 5) % 28)
  return (
    <button
      className="bookSpine"
      style={{ background: book.spine_color || '#8f5c45', height, '--delay': `${index * 24}ms` }}
      onClick={() => onOpen(book)}
      title={`${book.title} — ${book.author}`}
    >
      {book.is_favorite && <span className="favoritePin">♥</span>}
      <span className="bookTitle">{book.title}</span>
      <span className="bookAuthor">{book.author}</span>
    </button>
  )
}

function Shelf({ title, books, onOpen, emptyText, variant = 'default' }) {
  if (!books.length && title !== 'Любимые книги') return null
  return (
    <section className={`shelfSection shelfVariant-${variant}`}>
      <div className="shelfHeader">
        <h2>{title}</h2>
        <span className="bookCount">{books.length} {books.length === 1 ? 'книга' : books.length < 5 ? 'книги' : 'книг'}</span>
      </div>
      <div className="shelf">
        <div className="booksRow">
          {books.length > 0 ? books.map((book, index) => (
            <BookSpine key={book.id} book={book} onOpen={onOpen} index={index} />
          )) : <p className="emptyShelf">{emptyText}</p>}
        </div>
        <div className="shelfDecor" aria-hidden="true">
          <div className="tinyFrame"><span /></div>
          <div className="plantPot"><i></i><i></i><i></i></div>
        </div>
      </div>
    </section>
  )
}

function normalizeFileName(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'book-cover'
}

async function uploadCover(file, title) {
  if (!file) return ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Обложка должна быть JPG, PNG или WEBP')
  if (file.size > 2 * 1024 * 1024) throw new Error('Файл обложки слишком большой. Лучше до 2 МБ')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${Date.now()}-${normalizeFileName(title)}.${ext}`
  const { error } = await supabase.storage.from(COVER_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

function formFromBook(book) {
  return {
    ...emptyForm,
    ...book,
    read_date: book.read_date || '',
    quote: book.quote || '',
    cover_url: book.cover_url || '',
    rating_total: book.rating_total ?? 0,
    rating_plot: book.rating_plot ?? '',
    rating_characters: book.rating_characters ?? '',
    rating_style: book.rating_style ?? '',
    rating_ending: book.rating_ending ?? '',
  }
}

function AdminPanel({ books, onBookChanged }) {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [jsonImport, setJsonImport] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <section className="adminBox mutedAdmin">
        <h2>Админ-режим</h2>
        <p>Supabase пока не настроен. Когда добавишь `.env`, тут появится вход, добавление, редактирование и удаление книг.</p>
      </section>
    )
  }

  const currentEmail = session?.user?.email?.toLowerCase()
  const isAdmin = currentEmail && (adminEmails.length === 0 || adminEmails.includes(currentEmail))

  async function signIn(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage(`Не получилось войти: ${error.message}`)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function preparePayload(bookData, coverUrl) {
    return {
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      genre: bookData.genre || 'Детективы',
      status: 'Прочитано',
      is_favorite: Boolean(bookData.is_favorite),
      read_date: bookData.read_date || null,
      cover_url: coverUrl || bookData.cover_url || null,
      spine_color: bookData.spine_color || '#8f5c45',
      review: bookData.review.trim(),
      quote: bookData.quote?.trim() || null,
      rating_total: numberOrNull(bookData.rating_total),
      rating_plot: numberOrNull(bookData.rating_plot),
      rating_characters: numberOrNull(bookData.rating_characters),
      rating_style: numberOrNull(bookData.rating_style),
      rating_ending: numberOrNull(bookData.rating_ending),
    }
  }

  async function saveBook(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const uploadedCoverUrl = coverFile ? await uploadCover(coverFile, form.title) : ''
      const payload = preparePayload(form, uploadedCoverUrl)
      const request = editingId
        ? supabase.from('books').update(payload).eq('id', editingId)
        : supabase.from('books').insert(payload)
      const { error } = await request
      if (error) throw error
      setForm(emptyForm)
      setEditingId(null)
      setCoverFile(null)
      event.currentTarget.reset()
      setMessage(editingId ? 'Книга обновлена ✨' : 'Книга добавлена ✨')
      onBookChanged()
    } catch (error) {
      setMessage(`Ошибка сохранения: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(book) {
    setEditingId(book.id)
    setForm(formFromBook(book))
    setCoverFile(null)
    setMessage('Редактируешь книгу. Новую обложку можно не выбирать — старая останется.')
    setTimeout(() => document.querySelector('.adminBox')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setCoverFile(null)
    setMessage('Редактирование отменено')
  }

  async function deleteBook(book) {
    const ok = window.confirm(`Удалить «${book.title}»?`)
    if (!ok) return
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.from('books').delete().eq('id', book.id)
      if (error) throw error
      setMessage('Книга удалена')
      onBookChanged()
    } catch (error) {
      setMessage(`Не получилось удалить: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    setLoading(true)
    setMessage('')
    try {
      const parsed = JSON.parse(jsonImport)
      const importedBooks = Array.isArray(parsed) ? parsed : [parsed]
      const payload = importedBooks.map((book) => preparePayload({ ...emptyForm, ...book, status: 'Прочитано' }, ''))
      const { data, error } = await supabase.from('books').insert(payload).select('*')
      if (error) throw error
      setJsonImport('')
      setMessage(`Импортировано книг: ${payload.length}. Если книга не появилась на полке, обнови страницу и проверь Table Editor → books в этом же Supabase-проекте.`)
      if (data?.length) onBookChanged()
      else onBookChanged()
    } catch (error) {
      setMessage(`Импорт не получился: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <section className="adminBox compactAdmin">
        <h2>Вход для добавления книг</h2>
        <form onSubmit={signIn} className="loginForm">
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email" type="email" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="пароль" type="password" />
          <button disabled={loading}>{loading ? 'Входим...' : 'Войти'}</button>
        </form>
        {message && <p className="formMessage">{message}</p>}
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="adminBox compactAdmin">
        <h2>Ты вошла, но это не админ</h2>
        <p>Текущий email: {currentEmail}</p>
        <button onClick={signOut}>Выйти</button>
      </section>
    )
  }

  return (
    <section className="adminBox">
      <div className="adminTop">
        <div>
          <p className="eyebrow">Админ-режим</p>
          <h2>{editingId ? 'Редактировать книгу' : 'Добавить книгу'}</h2>
        </div>
        <button className="smallButton" onClick={signOut}>Выйти</button>
      </div>

      <form className="bookForm" onSubmit={saveBook}>
        <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Название" />
        <input required value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} placeholder="Автор" />
        <select value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })}>
          <option>Детективы</option>
          <option>Классика</option>
          <option>Фэнтези</option>
          <option>Хоррор</option>
          <option>Роман</option>
          <option>Нон-фикшн</option>
        </select>
        <input value={form.read_date} onChange={(event) => setForm({ ...form, read_date: event.target.value })} type="date" />

        <label className="fileField">
          <span>{editingId ? 'Заменить обложку, если нужно' : 'Обложка JPG/PNG/WEBP до 2 МБ'}</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} />
        </label>

        <label className="colorField">Цвет корешка <input value={form.spine_color} onChange={(event) => setForm({ ...form, spine_color: event.target.value })} type="color" /></label>
        <label className="checkboxField"><input checked={form.is_favorite} onChange={(event) => setForm({ ...form, is_favorite: event.target.checked })} type="checkbox" /> Любимая книга</label>
        <textarea required value={form.review} onChange={(event) => setForm({ ...form, review: event.target.value })} placeholder="Отзыв" />
        <textarea value={form.quote} onChange={(event) => setForm({ ...form, quote: event.target.value })} placeholder="Любимая цитата" />

        <div className="ratingInputs">
          {[
            ['rating_total', 'Общая'],
            ['rating_plot', 'Сюжет'],
            ['rating_characters', 'Персонажи'],
            ['rating_style', 'Стиль'],
            ['rating_ending', 'Концовка'],
          ].map(([key, label]) => (
            <label key={key}>{label}
              <input min="0" max="5" step="0.5" value={form[key] ?? ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} type="number" placeholder="0–5" />
            </label>
          ))}
        </div>

        <div className="formActions">
          <button disabled={loading}>{loading ? 'Сохраняю...' : editingId ? 'Сохранить изменения' : 'Добавить книгу'}</button>
          {editingId && <button className="ghostButton" type="button" onClick={cancelEdit}>Отменить</button>}
        </div>
      </form>

      <div className="adminList">
        <h3>Текущие книги</h3>
        <div className="adminBookGrid">
          {books.map((book) => (
            <article key={book.id} className="adminBookCard">
              <div>
                <strong>{book.title}</strong>
                <span>{book.author} · {formatScore(book.rating_total)}/5</span>
              </div>
              <div className="adminBookActions">
                <button type="button" onClick={() => startEdit(book)}>Редактировать</button>
                <button type="button" className="dangerButton" onClick={() => deleteBook(book)}>Удалить</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="importBox">
        <h3>Импорт через ChatGPT</h3>
        <p>Можно прислать мне сырой отзыв в свободной форме — я помогу превратить его в аккуратный текст и подготовлю JSON для вставки сюда. Обложку потом можно добавить через редактирование.</p>
        <textarea value={jsonImport} onChange={(event) => setJsonImport(event.target.value)} placeholder={'{ "title": "Название", "author": "Автор", "review": "Короткий отзыв", "rating_total": 4 }'} />
        <button type="button" onClick={handleImport} disabled={loading || !jsonImport.trim()}>Импортировать JSON</button>
      </div>

      {message && <p className="formMessage">{message}</p>}
    </section>
  )
}

function App() {
  const [books, setBooks] = useState(sampleBooks)
  const [selectedBook, setSelectedBook] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  
  async function loadBooks() {
    if (!supabase) {
      setBooks(sampleBooks)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('books').select('*').order('title', { ascending: true })
    setLoading(false)
    if (error) {
      console.warn('Supabase load failed, using local books:', error.message)
      setBooks(sampleBooks)
      return
    }
    setBooks(data?.length ? data : sampleBooks)
  }

  useEffect(() => { loadBooks() }, [])

  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const query = search.trim().toLowerCase()
        return !query || `${book.title} ${book.author} ${book.genre} ${book.review} ${book.quote || ''}`.toLowerCase().includes(query)
      })
      .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru'))
  }, [books, search])

  const favoriteBooks = filteredBooks.filter((book) => book.is_favorite || Number(book.rating_total) >= 4.5)
  const genres = [...new Set(filteredBooks.map((book) => book.genre || 'Без жанра'))]
  const averageRating = books.length
    ? (books.reduce((sum, book) => sum + (Number(book.rating_total) || 0), 0) / books.length).toFixed(1).replace('.', ',')
    : '0,0'

  return (
    <main className="appShell">
      <header className="hero">
        <div>
          <p className="eyebrow">семейная библиотека</p>
          <h1>Книжный шкаф с отзывами</h1>
          <p className="heroText">Отзывы, любимые твисты, запомнившиеся развязки и короткие впечатления о прочитанных книгах — общая полка для двоих.</p>
        </div>
        <div className="statsCard">
          <span>{books.length}</span><p>книг</p>
          <span>{averageRating}/5</span><p>средняя оценка</p>
        </div>
      </header>

      <section className="toolbar searchOnly">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти книгу, автора, цитату или фразу из отзыва" />
      </section>

      {loading && <p className="systemMessage">Загружаю книги...</p>}
      <Shelf title="Любимые книги" books={favoriteBooks} onOpen={setSelectedBook} emptyText="Пока нет любимых книг." variant="favorite" />
      {genres.map((genre) => (
        <Shelf key={genre} title={genre} books={filteredBooks.filter((book) => (book.genre || 'Без жанра') === genre)} onOpen={setSelectedBook} emptyText="На этой полке пока пусто." variant={genre.toLowerCase()} />
      ))}

      <AdminPanel books={books} onBookChanged={loadBooks} />
      <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
