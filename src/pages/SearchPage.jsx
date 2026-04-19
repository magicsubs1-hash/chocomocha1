import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import MovieCard from '../components/MovieCard'
import styles from './SearchPage.module.css'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    fetch(api(`/api/movies/search?q=${encodeURIComponent(q)}`))
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [q])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {q ? <>«{q}» хайлтын үр дүн</> : 'Хайх'}
      </h1>

      {loading ? (
        <div className={styles.loading}><div className={styles.spin} /></div>
      ) : results.length === 0 && q ? (
        <div className={styles.empty}>
          <p>«{q}» нэртэй кино олдсонгүй</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {results.map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </div>
  )
}
