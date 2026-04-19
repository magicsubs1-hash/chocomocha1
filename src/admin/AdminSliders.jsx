import { useState, useEffect } from 'react'
import { api } from '../api'
import styles from './Admin.module.css'

export default function AdminSliders() {
  const [sliders, setSliders] = useState([])
  const [movies, setMovies] = useState([])
  const [form, setForm] = useState({ movie_id: '', title: '', subtitle: '' })
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  function load() {
    fetch(api('/api/sliders')).then(r => r.json()).then(setSliders).catch(() => {})
    fetch(api('/api/movies')).then(r => r.json()).then(setMovies).catch(() => {})
  }
  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (imageFile) fd.append('image', imageFile)
    await fetch(api('/api/sliders'), { method: 'POST', body: fd })
    setForm({ movie_id: '', title: '', subtitle: '' })
    setImageFile(null)
    setSaving(false)
    load()
  }

  async function del(id) {
    if (!confirm('Устгах уу?')) return
    await fetch(api(`/api/sliders/${id}`), { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Слайд удирдлага</h1>

      <form onSubmit={handleSubmit} className={styles.sliderForm}>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>Кино сонгох</label>
            <select
              value={form.movie_id}
              onChange={e => {
                const m = movies.find(x => x.id === Number(e.target.value))
                setForm(f => ({ ...f, movie_id: e.target.value, title: m?.title || f.title }))
              }}
              className={styles.input}
            >
              <option value="">— сонгоогүй —</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Гарчиг</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={styles.input} placeholder="Слайд гарчиг" />
          </div>
          <div className={styles.field}>
            <label>Дэд гарчиг</label>
            <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className={styles.input} placeholder="Товч тайлбар" />
          </div>
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label>Зураг</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className={styles.input} />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? 'Нэмж байна...' : '+ Нэмэх'}
          </button>
        </div>
      </form>

      <div className={styles.table}>
        <table>
          <thead><tr><th>Зураг</th><th>Гарчиг</th><th>Кино</th><th>Үйлдэл</th></tr></thead>
          <tbody>
            {sliders.map(s => (
              <tr key={s.id}>
                <td>
                  {s.image
                    ? <img src={api(`/api/uploads/${s.image}`)} alt="" className={styles.tablePoster} />
                    : '—'
                  }
                </td>
                <td>{s.title || '—'}</td>
                <td>{s.movie_title || '—'}</td>
                <td>
                  <button onClick={() => del(s.id)} className={styles.btnDelete}>Устгах</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sliders.length === 0 && <p className={styles.empty}>Слайд байхгүй байна</p>}
      </div>
    </div>
  )
}
