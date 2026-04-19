import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import MovieCard from '../components/MovieCard'
import styles from './MovieDetailPage.module.css'

export default function MovieDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [related, setRelated] = useState([])
  const [activeSeason, setActiveSeason] = useState(1)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetch(api(`/api/movies/${slug}`))
      .then(r => r.json())
      .then(data => {
        setMovie(data)
        // Ангиуд авах (series бол)
        if (data.type === 'series') {
          fetch(api(`/api/movies/${data.id}/episodes`))
            .then(r => r.json())
            .then(ep => { setEpisodes(ep); if (ep.length) setActiveSeason(ep[0].season) })
        }
        return fetch(api('/api/movies')).then(r => r.json()).then(all =>
          setRelated(all.filter(m => m.id !== data.id).slice(0, 12))
        )
      })
      .catch(() => {})
  }, [slug])

  if (!movie) return <div className={styles.loading}><div className={styles.spin} /></div>

  const poster = movie.poster ? api(`/api/uploads/${movie.poster}`) : null
  const matchPct = movie.imdb ? Math.round(movie.imdb * 10) : null
  const movieSlug = movie.slug || movie.id
  const isSeries = movie.type === 'series'
  const seasons = [...new Set(episodes.map(e => e.season))].sort((a, b) => a - b)
  const seasonEps = episodes.filter(e => e.season === activeSeason)

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        {poster && <img src={poster} alt="" className={styles.heroImg} />}
        <div className={styles.heroVig} />
        <div className={styles.heroFade} />
        <div className={styles.heroInfo}>
          <h1 className={styles.heroTitle}>{movie.title}</h1>
          {movie.title_en && <p className={styles.heroSub}>{movie.title_en}</p>}
          <div className={styles.heroMeta}>
            {matchPct && <span className={styles.match}>{matchPct}% тохирол</span>}
            {movie.year && <span>{movie.year}</span>}
            {isSeries && <span>{episodes.length} анги</span>}
            {!isSeries && movie.duration && <span>{movie.duration} мин</span>}
            {movie.quality && <span className={styles.maturity}>{movie.quality}</span>}
            {movie.imdb && <span className={styles.imdbBadge}>★ {movie.imdb}</span>}
          </div>
          <button className={styles.heroPlay} onClick={() => {
            if (isSeries && episodes.length > 0) {
              navigate(`/watch/${movieSlug}?ep=${episodes[0].id}`)
            } else {
              navigate(`/watch/${movieSlug}`)
            }
          }}>
            <svg viewBox="0 0 24 24" fill="#000" width="22" height="22"><path d="M6 4l15 8-15 8z"/></svg>
            Тоглуулах
          </button>
        </div>
      </section>

      {/* Detail */}
      <div className={styles.detail}>
        <div className={styles.detailLeft}>
          {movie.description && <p className={styles.desc}>{movie.description}</p>}
        </div>
        <div className={styles.detailRight}>
          {movie.genre && <div className={styles.infoRow}><span className={styles.infoLabel}>Жанр:</span>{movie.genre}</div>}
          {movie.director && <div className={styles.infoRow}><span className={styles.infoLabel}>Найруулагч:</span>{movie.director}</div>}
          {movie.cast && <div className={styles.infoRow}><span className={styles.infoLabel}>Жүжигчид:</span>{movie.cast}</div>}
          {movie.language && <div className={styles.infoRow}><span className={styles.infoLabel}>Хэл:</span>{movie.language}</div>}
        </div>
      </div>

      {/* ── Episodes (series only) ── */}
      {isSeries && episodes.length > 0 && (
        <section className={styles.episodes}>
          <div className={styles.epHeader}>
            <h2>Ангиуд</h2>
            {seasons.length > 1 && (
              <select
                className={styles.seasonSelect}
                value={activeSeason}
                onChange={e => setActiveSeason(Number(e.target.value))}
              >
                {seasons.map(s => <option key={s} value={s}>Бүлэг {s}</option>)}
              </select>
            )}
          </div>
          <div className={styles.epList}>
            {seasonEps.map(ep => {
              const thumb = ep.thumbnail ? api(`/api/uploads/${ep.thumbnail}`) : null
              return (
                <div
                  key={ep.id}
                  className={styles.epItem}
                  onClick={() => navigate(`/watch/${movieSlug}?ep=${ep.id}`)}
                >
                  <div className={styles.epNum}>{ep.episode_num}</div>
                  <div className={styles.epThumb}>
                    {thumb
                      ? <img src={thumb} alt="" />
                      : <div className={styles.epNoThumb}>
                          <svg viewBox="0 0 24 24" fill="#666" width="28" height="28"><path d="M6 4l15 8-15 8z"/></svg>
                        </div>
                    }
                    <div className={styles.epPlayOverlay}>
                      <svg viewBox="0 0 24 24" fill="#fff" width="32" height="32"><path d="M6 4l15 8-15 8z"/></svg>
                    </div>
                    {ep.duration && <span className={styles.epDurBadge}>{ep.duration} мин</span>}
                  </div>
                  <div className={styles.epInfo}>
                    <div className={styles.epTitle}>{ep.title || `Анги ${ep.episode_num}`}</div>
                    {ep.description && <div className={styles.epDesc}>{ep.description}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedH}>Үүнтэй төстэй</h2>
          <div className={styles.relatedGrid}>
            {related.map(m => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}
    </div>
  )
}
