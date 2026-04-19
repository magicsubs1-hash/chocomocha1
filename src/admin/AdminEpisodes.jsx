import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import styles from './Admin.module.css'

export default function AdminEpisodes() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const [form, setForm] = useState({ season: 1, episode_num: '', title: '', description: '', video_url: '', duration: '' })
  const [thumbFile, setThumbFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([
      fetch(api(`/api/movies/${id}`)).then(r => r.json()),
      fetch(api(`/api/movies/${id}/episodes`)).then(r => r.json())
    ]).then(([m, ep]) => {
      setMovie(m)
      setEpisodes(ep)
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(load, [id])

  function resetForm() {
    setForm({ season: 1, episode_num: '', title: '', description: '', video_url: '', duration: '' })
    setThumbFile(null)
    setVideoFile(null)
    setEditId(null)
  }

  function startEdit(ep) {
    setEditId(ep.id)
    setForm({
      season: ep.season || 1,
      episode_num: ep.episode_num,
      title: ep.title || '',
      description: ep.description || '',
      video_url: ep.video_url || '',
      duration: ep.duration || ''
    })
    setThumbFile(null)
    setVideoFile(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()
    fd.append('movie_id', id)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (thumbFile) fd.append('thumbnail', thumbFile)
    if (videoFile) fd.append('video_file', videoFile)

    const url = editId ? api(`/api/episodes/${editId}`) : api('/api/episodes')
    const method = editId ? 'PUT' : 'POST'
    await fetch(url, { method, body: fd })
    setSaving(false)
    resetForm()
    load()
  }

  async function del(epId) {
    if (!confirm('Энэ ангийг устгах уу?')) return
    await fetch(api(`/api/episodes/${epId}`), { method: 'DELETE' })
    load()
  }

  // Бүлэг season-аар
  const seasons = [...new Set(episodes.map(e => e.season))].sort((a, b) => a - b)

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{movie?.title} — Ангиуд</h1>
          <Link to="/admin/movies" className={styles.btnBack}>← Кинонууд руу</Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.episodeForm}>
        <h3 className={styles.formSubtitle}>{editId ? 'Анги засах' : 'Шинэ анги нэмэх'}</h3>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>Бүлэг (Season)</label>
            <input type="number" min="1" value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label>Ангийн дугаар <span className={styles.req}>*</span></label>
            <input type="number" min="1" required value={form.episode_num} onChange={e => setForm(f => ({ ...f, episode_num: e.target.value }))} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label>Үргэлжлэх хугацаа (мин)</label>
            <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className={styles.input} />
          </div>
        </div>
        <div className={styles.field}>
          <label>Ангийн нэр</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={styles.input} placeholder="Анги 1: Эхлэл" />
        </div>
        <div className={styles.field}>
          <label>Тайлбар</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={styles.input} placeholder="Энэ ангийн товч тайлбар" />
        </div>
        <div className={styles.field}>
          <label>Видео URL</label>
          <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className={styles.input} placeholder="https://stream.mux.com/..." />
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>Thumbnail зураг</label>
            <input type="file" accept="image/*" onChange={e => setThumbFile(e.target.files[0])} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label>Видео файл</label>
            <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className={styles.input} />
          </div>
        </div>
        <div className={styles.formActions}>
          {editId && <button type="button" className={styles.btnSecondary} onClick={resetForm}>Цуцлах</button>}
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Хадгалж байна...' : editId ? 'Шинэчлэх' : '+ Анги нэмэх'}
          </button>
        </div>
      </form>

      {/* Episodes list */}
      {seasons.map(s => (
        <div key={s} className={styles.episodeSeason}>
          <h3 className={styles.seasonTitle}>Бүлэг {s}</h3>
          <div className={styles.episodeList}>
            {episodes.filter(ep => ep.season === s).map(ep => (
              <div key={ep.id} className={styles.episodeItem}>
                <div className={styles.episodeThumb}>
                  {ep.thumbnail
                    ? <img src={api(`/api/uploads/${ep.thumbnail}`)} alt="" />
                    : <div className={styles.episodeNoThumb}>{ep.episode_num}</div>
                  }
                  <span className={styles.episodeNum}>{ep.episode_num}</span>
                </div>
                <div className={styles.episodeInfo}>
                  <div className={styles.episodeTitle}>
                    {ep.title || `Анги ${ep.episode_num}`}
                    {ep.duration && <span className={styles.episodeDur}>{ep.duration} мин</span>}
                  </div>
                  {ep.description && <div className={styles.episodeDesc}>{ep.description}</div>}
                  {ep.video_url && <div className={styles.episodeUrl}>{ep.video_url.slice(0, 50)}...</div>}
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.btnEdit} onClick={() => startEdit(ep)}>Засах</button>
                  <button className={styles.btnDelete} onClick={() => del(ep.id)}>Устгах</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {episodes.length === 0 && <p className={styles.empty}>Анги нэмэгдээгүй байна</p>}
    </div>
  )
}
