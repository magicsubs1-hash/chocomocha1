import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import styles from './Admin.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ movies: 0, new_movies: 0, sliders: 0, users: 0, subscribers: 0, revenue: 0 })

  useEffect(() => {
    fetch(api('/api/admin/stats')).then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className={styles.pageTitle}>Хянах самбар</h1>
      <div className={styles.statsGrid}>
        <StatCard label="Нийт кино" value={stats.movies} link="/admin/movies" color="var(--accent)" />
        <StatCard label="Шинэ кино" value={stats.new_movies} link="/admin/movies" color="#4ade80" />
        <StatCard label="Хэрэглэгч" value={stats.users} link="/admin/users" color="#60a5fa" />
        <StatCard label="Захиалагч" value={stats.subscribers} link="/admin/users" color="#a78bfa" />
        <StatCard label="Нийт орлого" value={`₮${stats.revenue?.toLocaleString()}`} link="/admin/users" color="#fbbf24" />
        <StatCard label="Слайд" value={stats.sliders} link="/admin/sliders" color="#888" />
      </div>

      <div className={styles.quickActions}>
        <h2>Хурдан үйлдэл</h2>
        <div className={styles.actionBtns}>
          <Link to="/admin/movies/new" className={styles.btnPrimary}>+ Кино нэмэх</Link>
          <Link to="/admin/users" className={styles.btnSecondary}>Хэрэглэгчид →</Link>
          <Link to="/" target="_blank" className={styles.btnSecondary}>Сайт харах ↗</Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, link, color }) {
  return (
    <Link to={link} className={styles.statCard}>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </Link>
  )
}
