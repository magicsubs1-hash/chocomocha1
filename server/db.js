import Database from 'better-sqlite3'
import { createHash, randomBytes } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || __dir
const db = new Database(join(DATA_DIR, 'db.sqlite'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    title_en    TEXT,
    description TEXT,
    year        INTEGER,
    genre       TEXT,
    duration    INTEGER,
    imdb        REAL,
    quality     TEXT DEFAULT 'HD',
    language    TEXT DEFAULT 'Монгол хадмал',
    director    TEXT,
    cast        TEXT,
    poster      TEXT,
    video_url   TEXT,
    video_file  TEXT,
    subtitle    TEXT,
    slug        TEXT UNIQUE,
    is_new      INTEGER DEFAULT 1,
    created_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS episodes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id    INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    season      INTEGER DEFAULT 1,
    episode_num INTEGER NOT NULL,
    title       TEXT,
    description TEXT,
    thumbnail   TEXT,
    video_url   TEXT,
    video_file  TEXT,
    duration    INTEGER,
    created_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS sliders (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id  INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    image     TEXT,
    title     TEXT,
    subtitle  TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    name            TEXT,
    phone           TEXT,
    sub_until       INTEGER DEFAULT 0,
    created_at      INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER REFERENCES users(id),
    amount          INTEGER NOT NULL,
    plan            TEXT NOT NULL,
    days            INTEGER NOT NULL,
    invoice_id      TEXT,
    qr_image        TEXT,
    status          TEXT DEFAULT 'pending',
    created_at      INTEGER DEFAULT (unixepoch())
  );
`)

// Migrations
try { db.exec('ALTER TABLE movies ADD COLUMN subtitle TEXT') } catch {}
try { db.exec('ALTER TABLE movies ADD COLUMN slug TEXT') } catch {}
try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug)') } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN sub_until INTEGER DEFAULT 0') } catch {}
try { db.exec("ALTER TABLE movies ADD COLUMN type TEXT DEFAULT 'movie'") } catch {}

// ── Helper: slug (кирилл → латин) ──
const CYR = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','ө':'u','п':'p','р':'r','с':'s','т':'t','у':'u','ү':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sh','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'}

export function generateSlug(text, id) {
  let s = (text || '')
    .toLowerCase()
    .split('')
    .map(c => CYR[c] || c)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  if (!s) s = 'movie'
  const exists = db.prepare('SELECT id FROM movies WHERE slug=? AND id!=?').get(s, id || 0)
  if (exists) s = `${s}-${id || Date.now()}`
  return s
}

// Slug байхгүй / буруу slug-тай кинонуудыг шинэчлэх
const fixSlug = db.prepare("SELECT id, title, title_en FROM movies WHERE slug IS NULL OR slug LIKE 'movie%'").all()
for (const m of fixSlug) {
  const s = generateSlug(m.title_en || m.title, m.id)
  db.prepare('UPDATE movies SET slug=? WHERE id=?').run(s, m.id)
}

// ── Helper: password hash ──
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(salt + password).digest('hex')
  return salt + ':' + hash
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const check = createHash('sha256').update(salt + password).digest('hex')
  return check === hash
}

// ── Helper: simple token ──
const JWT_SECRET = process.env.JWT_SECRET || 'dxkino-secret-'

export function createToken(userId) {
  const payload = JSON.stringify({ id: userId, ts: Date.now() })
  const sig = createHash('sha256').update(JWT_SECRET + payload).digest('hex').slice(0, 16)
  return Buffer.from(payload).toString('base64') + '.' + sig
}

export function verifyToken(token) {
  if (!token) return null
  const [b64, sig] = token.split('.')
  if (!b64 || !sig) return null
  const payload = Buffer.from(b64, 'base64').toString()
  const check = createHash('sha256').update(JWT_SECRET + payload).digest('hex').slice(0, 16)
  if (check !== sig) return null
  try { return JSON.parse(payload) } catch { return null }
}

export default db
