import { useState, useEffect } from 'react'
import { api } from '../api'
import MovieCard from '../components/MovieCard'
import styles from './MoviesPage.module.css'

export default function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [activeGenre, setActiveGenre] = useState('all')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(api('/api/movies'))
      .then(r => r.json())
      .then(data => {
        setMovies(data)
        const g = new Set()
        data.forEach(m => m.genre && m.genre.split(',').forEach(x => g.add(x.trim())))
        setGenres([...g].filter(Boolean))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = movies
    .filter(m => activeGenre === 'all' || (m.genre && m.genre.includes(activeGenre)))
    .sort((a, b) => {
      if (sort === 'newest') return b.id - a.id
      if (sort === 'oldest') return a.id - b.id
      if (sort === 'imdb') return (b.imdb || 0) - (a.imdb || 0)
      if (sort === 'year') return (b.year || 0) - (a.year || 0)
      return 0
    })

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Кинонууд</h1>
        <div className={styles.controls}>
          <div className={styles.dropdown}>
            <select value={activeGenre} onChange={e => setActiveGenre(e.target.value)} className={styles.select}>
              <option value="all">Жанр: Бүгд</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className={styles.dropdown}>
            <select value={sort} onChange={e => setSort(e.target.value)} className={styles.select}>
              <option value="newest">Шинэ эхэнд</option>
              <option value="oldest">Хуучин эхэнд</option>
              <option value="imdb">IMDb оноогоор</option>
              <option value="year">Он жилээр</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spin} /></div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>Кино олдсонгүй</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </div>
  )
}
