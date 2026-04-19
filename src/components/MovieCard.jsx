import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import styles from './MovieCard.module.css'

export default function MovieCard({ movie }) {
  const [hover, setHover] = useState(false)
  const navigate = useNavigate()
  const timer = useRef(null)

  const poster = movie.poster
    ? api(`/api/uploads/${movie.poster}`)
    : `https://via.placeholder.com/300x450/181818/333?text=${encodeURIComponent(movie.title?.slice(0,4) || '?')}`

  const slug = movie.slug || movie.id
  const matchPct = movie.imdb ? Math.round(movie.imdb * 10) : null

  function enter() { timer.current = setTimeout(() => setHover(true), 400) }
  function leave() { clearTimeout(timer.current); setHover(false) }

  return (
    <div className={styles.wrap} onMouseEnter={enter} onMouseLeave={leave}>
      <Link to={`/movie/${slug}`} className={styles.card}>
        <img src={poster} alt={movie.title} loading="lazy" />
        {movie.imdb && (
          <div className={styles.imdbBadge}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#f5c518"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {movie.imdb}
          </div>
        )}
      </Link>

      {/* Netflix hover card */}
      {hover && (
        <div className={styles.hoverCard}>
          <Link to={`/movie/${slug}`} className={styles.hoverImg}>
            <img src={poster} alt={movie.title} />
          </Link>
          <div className={styles.hoverBody}>
            {/* Action buttons */}
            <div className={styles.actions}>
              <button className={styles.playCircle} onClick={() => navigate(`/watch/${slug}`)} aria-label="play">
                <svg viewBox="0 0 24 24" fill="#000" width="18" height="18"><path d="M6 4l15 8-15 8z"/></svg>
              </button>
              <Link to={`/movie/${slug}`} className={styles.circleBtn} aria-label="info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M6 9l6 6 6-6"/></svg>
              </Link>
            </div>
            {/* Meta */}
            <div className={styles.meta}>
              {matchPct && <span className={styles.match}>{matchPct}% тохирол</span>}
              {movie.quality && <span className={styles.maturity}>{movie.quality}</span>}
              {movie.duration && <span className={styles.dur}>{movie.duration} мин</span>}
            </div>
            {/* Genre tags */}
            {movie.genre && (
              <div className={styles.genres}>
                {movie.genre.split(',').slice(0, 3).map((g, i) => (
                  <span key={g}>{i > 0 && <span className={styles.dot}>•</span>}{g.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
