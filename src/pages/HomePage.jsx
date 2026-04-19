import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import MovieCard from '../components/MovieCard'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [hero, setHero] = useState(null)
  const [sections, setSections] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch(api('/api/movies'))
      .then(r => r.json())
      .then(movies => {
        const sorted = [...movies].sort((a, b) => b.id - a.id)
        setHero(sorted[0] || null)

        const rows = []
        const newOnes = sorted.filter(m => m.is_new)
        if (newOnes.length > 0) rows.push({ title: 'Шинэ нэмэгдсэн', movies: newOnes })

        // Жанраар
        const gMap = {}
        sorted.forEach(m => {
          if (!m.genre) return
          m.genre.split(',').forEach(g => {
            const n = g.trim()
            if (!n) return
            if (!gMap[n]) gMap[n] = []
            if (!gMap[n].find(x => x.id === m.id)) gMap[n].push(m)
          })
        })
        Object.entries(gMap).forEach(([n, list]) => {
          if (list.length >= 1) rows.push({ title: n, movies: list })
        })

        rows.push({ title: 'Бүгд', movies: sorted })
        setSections(rows)
      })
      .catch(() => {})
  }, [])

  if (!hero) return <div className={styles.loading}><div className={styles.spin} /></div>

  const bg = hero.poster ? api(`/api/uploads/${hero.poster}`) : null
  const slug = hero.slug || hero.id

  return (
    <div className={styles.page}>
      {/* ── Billboard ── */}
      <section className={styles.billboard}>
        {bg && <img src={bg} alt="" className={styles.bg} />}
        <div className={styles.vignette} />
        <div className={styles.fade} />
        <div className={styles.info}>
          <h1>{hero.title}</h1>
          {hero.description && <p className={styles.desc}>{hero.description.slice(0, 150)}</p>}
          <div className={styles.btns}>
            <button className={styles.playBtn} onClick={() => navigate(`/watch/${slug}`)}>
              <svg viewBox="0 0 24 24" fill="#000" width="22" height="22"><path d="M6 4l15 8-15 8z"/></svg>
              Тоглуулах
            </button>
            <Link to={`/movie/${slug}`} className={styles.moreBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              Дэлгэрэнгүй
            </Link>
          </div>
        </div>
      </section>

      {/* ── Rows ── */}
      <div className={styles.rows}>
        {sections.map((s, i) => <Row key={s.title + i} title={s.title} movies={s.movies} />)}
      </div>
    </div>
  )
}

function Row({ title, movies }) {
  const ref = useRef(null)
  const [canL, setCanL] = useState(false)
  const [canR, setCanR] = useState(true)

  function check() {
    const el = ref.current; if (!el) return
    setCanL(el.scrollLeft > 10)
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }
  function scroll(d) { ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.75, behavior: 'smooth' }) }

  return (
    <section className={styles.row}>
      <h2 className={styles.rowTitle}>{title} <span className={styles.explore}>Бүгдийг харах ›</span></h2>
      <div className={styles.slider}>
        {canL && <button className={`${styles.arrow} ${styles.arrowL}`} onClick={() => scroll(-1)}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="22" height="22"><path d="M15 18l-6-6 6-6"/></svg></button>}
        <div className={styles.track} ref={ref} onScroll={check}>
          {movies.map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
        {canR && <button className={`${styles.arrow} ${styles.arrowR}`} onClick={() => scroll(1)}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="22" height="22"><path d="M9 18l6-6-6-6"/></svg></button>}
      </div>
    </section>
  )
}
