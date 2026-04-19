import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import styles from './Admin.module.css'

export default function AdminMovieForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [posterPreview, setPosterPreview] = useState(null)

  const [form, setForm] = useState({
    title: '', title_en: '', description: '', year: '',
    genre: '', duration: '', imdb: '', quality: 'HD',
    language: 'Монгол хадмал', director: '', cast: '',
    video_url: '', is_new: true, type: 'movie'
  })
  const [posterFile, setPosterFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [subtitleFile, setSubtitleFile] = useState(null)
  const [existingSubtitle, setExistingSubtitle] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    fetch(api(`/api/movies/${id}`))
      .then(r => r.json())
      .then(m => {
        setForm({
          title: m.title || '', title_en: m.title_en || '',
          description: m.description || '', year: m.year || '',
          genre: m.genre || '', duration: m.duration || '',
          imdb: m.imdb || '', quality: m.quality || 'HD',
          language: m.language || 'Монгол хадмал',
          director: m.director || '', cast: m.cast || '',
          video_url: m.video_url || '', is_new: Boolean(m.is_new), type: m.type || 'movie'
        })
        if (m.poster) setPosterPreview(api(`/api/uploads/${m.poster}`))
        if (m.subtitle) setExistingSubtitle(m.subtitle)
      })
  }, [id])

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  // URL-г тохирох формат руу хөрвүүлэх
  function toEmbedUrl(url) {
    if (!url) return ''
    // youtube.com/watch?v=ID
    let m = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&autoplay=1`
    // youtu.be/ID
    m = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&autoplay=1`
    // vimeo.com/ID
    m = url.match(/vimeo\.com\/(\d+)/)
    if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`
    // mux.com болон .m3u8 — тэр хэвээр хадгална (HLS player тоглуулна)
    if (url.includes('stream.mux.com') || url.includes('.m3u8')) return url
    // аль хэдийн embed байвал тэр хэвээр
    return url
  }

  function handleVideoUrlChange(raw) {
    const converted = toEmbedUrl(raw)
    set('video_url', converted || raw)
  }

  function urlTypeLabel(url) {
    if (!url) return ''
    if (url.includes('stream.mux.com') || url.includes('.m3u8')) return '● Mux / HLS stream'
    if (url.includes('youtube.com/embed')) return '● YouTube embed'
    if (url.includes('player.vimeo.com')) return '● Vimeo embed'
    return '● Шууд URL'
  }

  const isMuxOrHls = form.video_url && (
    form.video_url.includes('stream.mux.com') || form.video_url.includes('.m3u8')
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (posterFile) fd.append('poster', posterFile)
    if (videoFile) fd.append('video_file', videoFile)
    if (subtitleFile) fd.append('subtitle', subtitleFile)

    const url = isEdit ? api(`/api/movies/${id}`) : api('/api/movies')
    const method = isEdit ? 'PUT' : 'POST'

    const r = await fetch(url, { method, body: fd })
    if (r.ok) {
      navigate('/admin/movies')
    } else {
      const d = await r.json()
      setError(d.error || 'Алдаа гарлаа')
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>{isEdit ? 'Кино засах' : 'Кино нэмэх'}</h1>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Left column */}
          <div className={styles.formLeft}>
            <div className={styles.posterUpload}>
              {posterPreview
                ? <img src={posterPreview} alt="poster" className={styles.posterImg} />
                : <div className={styles.posterPlaceholder}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    <span>Постер оруулах</span>
                  </div>
              }
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={e => {
                  const f = e.target.files[0]
                  if (f) { setPosterFile(f); setPosterPreview(URL.createObjectURL(f)) }
                }}
              />
            </div>

            <div className={styles.field}>
              <label>Видео файл</label>
              <input
                type="file"
                accept="video/*"
                onChange={e => setVideoFile(e.target.files[0])}
                className={styles.input}
              />
              {videoFile && <span className={styles.hint}>{videoFile.name}</span>}
            </div>

            <div className={styles.field}>
              <label>Видео URL</label>
              <input
                type="text"
                value={form.video_url}
                onChange={e => handleVideoUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={styles.input}
              />
              {form.video_url && (
                <span className={styles.hint}>
                  Embed: {form.video_url.slice(0, 50)}...
                </span>
              )}
            </div>

            {form.video_url && (
              <div className={styles.field}>
                <label>Preview</label>
                {isMuxOrHls ? (
                  <div className={styles.hlsNotice}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    <span>Mux / HLS stream — тоглуулагчид шууд тоглуулна</span>
                  </div>
                ) : (
                  <div className={styles.iframePreview}>
                    <iframe
                      src={form.video_url}
                      allowFullScreen
                      allow="autoplay; fullscreen; encrypted-media"
                      title="preview"
                    />
                  </div>
                )}
              </div>
            )}

            <div className={styles.field}>
              <label>Хадмал (subtitle) файл (.srt, .vtt)</label>
              <input
                type="file"
                accept=".srt,.vtt"
                onChange={e => setSubtitleFile(e.target.files[0])}
                className={styles.input}
              />
              {subtitleFile && <span className={styles.hint}>{subtitleFile.name}</span>}
              {!subtitleFile && existingSubtitle && (
                <span className={styles.hint}>Одоогийн: {existingSubtitle}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Төрөл</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={styles.input}>
                <option value="movie">Кино</option>
                <option value="series">Олон ангит цуврал</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.is_new}
                  onChange={e => set('is_new', e.target.checked)}
                />
                <span>Шинэ гэж тэмдэглэх</span>
              </label>
            </div>
          </div>

          {/* Right column */}
          <div className={styles.formRight}>
            <div className={styles.field}>
              <label>Нэр <span className={styles.req}>*</span></label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} className={styles.input} placeholder="Монгол нэр" />
            </div>

            <div className={styles.field}>
              <label>Англи нэр</label>
              <input value={form.title_en} onChange={e => set('title_en', e.target.value)} className={styles.input} placeholder="English title" />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Он</label>
                <input type="number" value={form.year} onChange={e => set('year', e.target.value)} className={styles.input} placeholder="2024" min="1900" max="2099" />
              </div>
              <div className={styles.field}>
                <label>Үргэлжлэх хугацаа (мин)</label>
                <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)} className={styles.input} placeholder="120" />
              </div>
              <div className={styles.field}>
                <label>IMDb оноо</label>
                <input type="number" step="0.1" min="0" max="10" value={form.imdb} onChange={e => set('imdb', e.target.value)} className={styles.input} placeholder="7.5" />
              </div>
            </div>

            <div className={styles.field}>
              <label>Жанр (таслалаар тусгаарла)</label>
              <input value={form.genre} onChange={e => set('genre', e.target.value)} className={styles.input} placeholder="Экшн, Драм, Инээдмийн" />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Чанар</label>
                <select value={form.quality} onChange={e => set('quality', e.target.value)} className={styles.input}>
                  <option>HD</option><option>FHD</option><option>4K</option><option>CAM</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Хэл</label>
                <select value={form.language} onChange={e => set('language', e.target.value)} className={styles.input}>
                  <option>Монгол хадмал</option>
                  <option>Монгол дуублаж</option>
                  <option>Англи хэл</option>
                  <option>Орос хэл</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label>Найруулагч</label>
              <input value={form.director} onChange={e => set('director', e.target.value)} className={styles.input} placeholder="Найруулагчийн нэр" />
            </div>

            <div className={styles.field}>
              <label>Жүжигчид</label>
              <input value={form.cast} onChange={e => set('cast', e.target.value)} className={styles.input} placeholder="Жүжигчдийн нэрс" />
            </div>

            <div className={styles.field}>
              <label>Тайлбар</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} className={styles.textarea} rows={4} placeholder="Киноны тухай товч тайлбар..." />
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => navigate('/admin/movies')}>Цуцлах</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
