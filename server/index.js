import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import QRCode from 'qrcode'
import db, { hashPassword, verifyPassword, createToken, verifyToken, generateSlug } from './db.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || join(__dir, '..')
const uploadsDir = join(DATA_DIR, 'uploads')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const app = express()
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || '*'
}))
app.use(express.json())
app.use('/api/uploads', express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const ext = extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } })

// ── Auth middleware ──────────────────────────────────────
function authUser(req, res, next) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' })
  const data = verifyToken(h.slice(7))
  if (!data) return res.status(401).json({ error: 'Токен буруу' })
  const user = db.prepare('SELECT id,email,name,phone,sub_until FROM users WHERE id=?').get(data.id)
  if (!user) return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' })
  req.user = user
  next()
}

// ── Bank Config ─────────────────────────────────────────
const BANK_NAME = 'Хаан банк'
const BANK_ACCOUNT = '5028731733'
const BANK_ACCOUNT_NAME = 'DX Kino'

// ── Subscription Plans ──────────────────────────────────
const PLANS = {
  '1month': { name: '1 Сар', days: 30, price: 9900, desc: '1 сарын эрх' },
  '3month': { name: '3 Сар', days: 90, price: 24900, desc: '3 сарын эрх (17% хэмнэлт)' },
  '12month': { name: '1 Жил', days: 365, price: 79900, desc: '1 жилийн эрх (33% хэмнэлт)' },
}

// ── Subtitle ────────────────────────────────────────────
app.get('/api/subtitle/:filename', (req, res) => {
  const filePath = join(uploadsDir, req.params.filename)
  if (!existsSync(filePath)) return res.status(404).send('Not found')
  const raw = readFileSync(filePath, 'utf-8')
  if (req.params.filename.endsWith('.vtt')) {
    res.type('text/vtt').send(raw)
  } else {
    const vtt = 'WEBVTT\n\n' + raw.replace(/\r\n/g, '\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    res.type('text/vtt').send(vtt)
  }
})

// ══════════════════════════════════════════════════════════
// ── USER AUTH ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phone } = req.body
  if (!email || !password) return res.status(400).json({ error: 'И-мэйл, нууц үг шаардлагатай' })
  if (password.length < 6) return res.status(400).json({ error: 'Нууц үг хамгийн багадаа 6 тэмдэгт' })
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email)
  if (exists) return res.status(400).json({ error: 'Энэ и-мэйл бүртгэлтэй байна' })
  const hash = hashPassword(password)
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO users (email,password_hash,name,phone) VALUES (?,?,?,?)'
  ).run(email, hash, name || null, phone || null)
  const user = db.prepare('SELECT id,email,name,phone,sub_until FROM users WHERE id=?').get(lastInsertRowid)
  res.json({ user, token: createToken(user.id) })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'И-мэйл, нууц үг шаардлагатай' })
  const row = db.prepare('SELECT * FROM users WHERE email=?').get(email)
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'И-мэйл эсвэл нууц үг буруу' })
  }
  const user = { id: row.id, email: row.email, name: row.name, phone: row.phone, sub_until: row.sub_until }
  res.json({ user, token: createToken(user.id) })
})

app.get('/api/auth/me', authUser, (req, res) => {
  const now = Math.floor(Date.now() / 1000)
  res.json({
    ...req.user,
    is_subscribed: req.user.sub_until > now,
    days_left: Math.max(0, Math.ceil((req.user.sub_until - now) / 86400))
  })
})

// ══════════════════════════════════════════════════════════
// ── PLANS ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

app.get('/api/plans', (_, res) => {
  const list = Object.entries(PLANS).map(([key, p]) => ({ key, ...p }))
  res.json(list)
})

// ══════════════════════════════════════════════════════════
// ── PAYMENT (Bank QR) ────────────────────────────────────
// ══════════════════════════════════════════════════════════

app.post('/api/payment/create', authUser, async (req, res) => {
  const { plan } = req.body
  const p = PLANS[plan]
  if (!p) return res.status(400).json({ error: 'Багц олдсонгүй' })

  const { lastInsertRowid } = db.prepare(
    'INSERT INTO payments (user_id,amount,plan,days) VALUES (?,?,?,?)'
  ).run(req.user.id, p.price, plan, p.days)
  const paymentId = Number(lastInsertRowid)
  const ref = `DXKINO-${paymentId}`

  db.prepare('UPDATE payments SET invoice_id=? WHERE id=?').run(ref, paymentId)

  // QR код: банкны мэдээлэл + дүн + гүйлгээний утга
  const qrData = [
    `Банк: ${BANK_NAME}`,
    `Данс: ${BANK_ACCOUNT}`,
    `Хүлээн авагч: ${BANK_ACCOUNT_NAME}`,
    `Дүн: ₮${p.price.toLocaleString()}`,
    `Гүйлгээний утга: ${ref}`,
  ].join('\n')

  const qrImage = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#000', light: '#fff' }
  })

  res.json({
    payment_id: paymentId,
    qr_image: qrImage,
    bank_name: BANK_NAME,
    bank_account: BANK_ACCOUNT,
    bank_account_name: BANK_ACCOUNT_NAME,
    amount: p.price,
    plan: p.name,
    ref
  })
})

// Төлбөр шалгах (frontend polling — админ баталгаажуулсан эсэх)
app.get('/api/payment/check/:id', authUser, (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id=? AND user_id=?').get(req.params.id, req.user.id)
  if (!payment) return res.status(404).json({ error: 'Not found' })
  res.json({ status: payment.status })
})

// Админ: төлбөр баталгаажуулах
app.post('/api/admin/payment/:id/confirm', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id=?').get(req.params.id)
  if (!payment) return res.status(404).json({ error: 'Not found' })
  if (payment.status === 'paid') return res.json({ ok: true, message: 'Аль хэдийн идэвхжсэн' })
  activateSubscription(payment)
  res.json({ ok: true })
})

// Админ: төлбөр цуцлах
app.post('/api/admin/payment/:id/reject', (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id=?').get(req.params.id)
  if (!payment) return res.status(404).json({ error: 'Not found' })
  db.prepare('UPDATE payments SET status=? WHERE id=?').run('rejected', payment.id)
  res.json({ ok: true })
})

function activateSubscription(payment) {
  const now = Math.floor(Date.now() / 1000)
  const user = db.prepare('SELECT sub_until FROM users WHERE id=?').get(payment.user_id)
  const currentEnd = Math.max(user.sub_until || 0, now)
  const newEnd = currentEnd + payment.days * 86400

  db.prepare('UPDATE users SET sub_until=? WHERE id=?').run(newEnd, payment.user_id)
  db.prepare('UPDATE payments SET status=? WHERE id=?').run('paid', payment.id)
}

// Subscription шалгах endpoint (player-с дуудна)
app.get('/api/auth/check-sub', authUser, (req, res) => {
  const now = Math.floor(Date.now() / 1000)
  res.json({ subscribed: req.user.sub_until > now })
})

// ══════════════════════════════════════════════════════════
// ── MOVIES ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════

app.get('/api/movies', (req, res) => {
  const { limit, genre } = req.query
  let sql = 'SELECT * FROM movies WHERE 1=1'
  const params = []
  if (genre) { sql += ' AND genre LIKE ?'; params.push(`%${genre}%`) }
  sql += ' ORDER BY created_at DESC'
  if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)) }
  res.json(db.prepare(sql).all(...params))
})

app.get('/api/movies/search', (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  res.json(db.prepare(
    `SELECT * FROM movies WHERE title LIKE ? OR title_en LIKE ? OR genre LIKE ? ORDER BY created_at DESC LIMIT 30`
  ).all(`%${q}%`, `%${q}%`, `%${q}%`))
})

app.get('/api/movies/:idOrSlug', (req, res) => {
  const p = req.params.idOrSlug
  const row = /^\d+$/.test(p)
    ? db.prepare('SELECT * FROM movies WHERE id = ?').get(p)
    : db.prepare('SELECT * FROM movies WHERE slug = ?').get(p)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

app.post('/api/movies', upload.fields([{ name: 'poster' }, { name: 'video_file' }, { name: 'subtitle' }]), (req, res) => {
  const b = req.body
  const poster = req.files?.poster?.[0]?.filename || null
  const video_file = req.files?.video_file?.[0]?.filename || null
  const subtitle = req.files?.subtitle?.[0]?.filename || null
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO movies (title,title_en,description,year,genre,duration,imdb,quality,language,director,cast,poster,video_url,video_file,subtitle,is_new)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(b.title, b.title_en||null, b.description||null, b.year||null, b.genre||null, b.duration||null, b.imdb||null,
    b.quality||'HD', b.language||'Монгол хадмал', b.director||null, b.cast||null,
    poster, b.video_url||null, video_file, subtitle, b.is_new === 'false' ? 0 : 1)
  const id = Number(lastInsertRowid)
  const slug = generateSlug(b.title_en || b.title, id)
  db.prepare('UPDATE movies SET slug=? WHERE id=?').run(slug, id)
  res.json(db.prepare('SELECT * FROM movies WHERE id = ?').get(id))
})

app.put('/api/movies/:id', upload.fields([{ name: 'poster' }, { name: 'video_file' }, { name: 'subtitle' }]), (req, res) => {
  const b = req.body
  const existing = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const poster = req.files?.poster?.[0]?.filename || existing.poster
  const video_file = req.files?.video_file?.[0]?.filename || existing.video_file
  const subtitle = req.files?.subtitle?.[0]?.filename || existing.subtitle
  db.prepare(`
    UPDATE movies SET title=?,title_en=?,description=?,year=?,genre=?,duration=?,imdb=?,
      quality=?,language=?,director=?,cast=?,poster=?,video_url=?,video_file=?,subtitle=?,is_new=? WHERE id=?
  `).run(b.title, b.title_en||null, b.description||null, b.year||null, b.genre||null, b.duration||null, b.imdb||null,
    b.quality||'HD', b.language||'Монгол хадмал', b.director||null, b.cast||null,
    poster, b.video_url||null, video_file, subtitle, b.is_new === 'false' ? 0 : 1, req.params.id)
  const slug = generateSlug(b.title_en || b.title, Number(req.params.id))
  db.prepare('UPDATE movies SET slug=? WHERE id=?').run(slug, req.params.id)
  res.json(db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id))
})

app.delete('/api/movies/:id', (req, res) => {
  db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Episodes ─────────────────────────────────────────────
app.get('/api/movies/:movieId/episodes', (req, res) => {
  const rows = db.prepare('SELECT * FROM episodes WHERE movie_id=? ORDER BY season, episode_num').all(req.params.movieId)
  res.json(rows)
})

app.post('/api/episodes', upload.fields([{ name: 'thumbnail' }, { name: 'video_file' }]), (req, res) => {
  const b = req.body
  const thumbnail = req.files?.thumbnail?.[0]?.filename || null
  const video_file = req.files?.video_file?.[0]?.filename || null
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO episodes (movie_id,season,episode_num,title,description,thumbnail,video_url,video_file,duration)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    b.movie_id, b.season||1, b.episode_num,
    b.title||null, b.description||null,
    thumbnail, b.video_url||null, video_file,
    b.duration||null
  )
  res.json(db.prepare('SELECT * FROM episodes WHERE id=?').get(lastInsertRowid))
})

app.put('/api/episodes/:id', upload.fields([{ name: 'thumbnail' }, { name: 'video_file' }]), (req, res) => {
  const b = req.body
  const existing = db.prepare('SELECT * FROM episodes WHERE id=?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const thumbnail = req.files?.thumbnail?.[0]?.filename || existing.thumbnail
  const video_file = req.files?.video_file?.[0]?.filename || existing.video_file
  db.prepare(`
    UPDATE episodes SET season=?,episode_num=?,title=?,description=?,thumbnail=?,video_url=?,video_file=?,duration=?
    WHERE id=?
  `).run(
    b.season||1, b.episode_num, b.title||null, b.description||null,
    thumbnail, b.video_url||null, video_file, b.duration||null,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM episodes WHERE id=?').get(req.params.id))
})

app.delete('/api/episodes/:id', (req, res) => {
  db.prepare('DELETE FROM episodes WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Sliders ──────────────────────────────────────────────
app.get('/api/sliders', (_, res) => {
  res.json(db.prepare('SELECT s.*, m.title as movie_title FROM sliders s LEFT JOIN movies m ON s.movie_id = m.id ORDER BY sort_order').all())
})
app.post('/api/sliders', upload.single('image'), (req, res) => {
  const b = req.body; const image = req.file?.filename || null
  const { lastInsertRowid } = db.prepare('INSERT INTO sliders (movie_id,image,title,subtitle,sort_order) VALUES (?,?,?,?,?)')
    .run(b.movie_id||null, image, b.title||null, b.subtitle||null, b.sort_order||0)
  res.json(db.prepare('SELECT * FROM sliders WHERE id = ?').get(lastInsertRowid))
})
app.delete('/api/sliders/:id', (req, res) => {
  db.prepare('DELETE FROM sliders WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Admin ────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  const expected = process.env.ADMIN_PASS || (process.env.NODE_ENV === 'production' ? null : 'admin123')
  if (expected && password === expected) {
    res.json({ ok: true, token: 'dxkino-admin' })
  } else {
    res.status(401).json({ error: 'Нууц үг буруу' })
  }
})

app.get('/api/admin/users', (_, res) => {
  res.json(db.prepare('SELECT id,email,name,phone,sub_until,created_at FROM users ORDER BY created_at DESC').all())
})

app.get('/api/admin/payments', (_, res) => {
  res.json(db.prepare(`
    SELECT p.*, u.name as user_name, u.email as user_email
    FROM payments p LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all())
})

app.get('/api/admin/stats', (_, res) => {
  res.json({
    movies: db.prepare('SELECT COUNT(*) as c FROM movies').get().c,
    new_movies: db.prepare('SELECT COUNT(*) as c FROM movies WHERE is_new = 1').get().c,
    sliders: db.prepare('SELECT COUNT(*) as c FROM sliders').get().c,
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    subscribers: db.prepare('SELECT COUNT(*) as c FROM users WHERE sub_until > unixepoch()').get().c,
    revenue: db.prepare("SELECT COALESCE(SUM(amount),0) as c FROM payments WHERE status='paid'").get().c,
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, '0.0.0.0', () => console.log(`DXKino server: http://0.0.0.0:${PORT}`))
