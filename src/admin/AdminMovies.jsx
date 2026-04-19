import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import styles from './Admin.module.css'

export default function AdminMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    fetch(api('/api/movies'))
      .then(r => r.json())
      .then(d => { setMovies(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  async function del(id, title) {
    if (!confirm(`"${title}" кинийг устгах уу?`)) return
    await fetch(api(`/api/movies/${id}`), { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Кинонууд</h1>
        <Link to="/admin/movies/new" className={styles.btnPrimary}>+ Нэмэх</Link>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Постер</th>
                <th>Нэр</th>
                <th>Он</th>
                <th>Жанр</th>
                <th>IMDb</th>
                <th>Чанар</th>
                <th>Шинэ</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {movies.map(m => (
                <tr key={m.id}>
                  <td>
                    {m.poster
                      ? <img src={api(`/api/uploads/${m.poster}`)} alt="" className={styles.tablePoster} />
                      : <div className={styles.noPoster}>—</div>
                    }
                  </td>
                  <td>
                    <div className={styles.movieTitle}>{m.title}</div>
                    {m.title_en && <div className={styles.movieTitleEn}>{m.title_en}</div>}
                  </td>
                  <td>{m.year || '—'}</td>
                  <td>{m.genre || '—'}</td>
                  <td>{m.imdb || '—'}</td>
                  <td>{m.quality || '—'}</td>
                  <td>
                    <span className={m.is_new ? styles.badgeGreen : styles.badgeGray}>
                      {m.is_new ? 'Тийм' : 'Үгүй'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {m.type === 'series' && <Link to={`/admin/movies/${m.id}/episodes`} className={styles.btnEdit}>Ангиуд</Link>}
                      <Link to={`/admin/movies/${m.id}/edit`} className={styles.btnEdit}>Засах</Link>
                      <button onClick={() => del(m.id, m.title)} className={styles.btnDelete}>Устгах</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movies.length === 0 && <p className={styles.empty}>Кино байхгүй байна</p>}
        </div>
      )}
    </div>
  )
}
