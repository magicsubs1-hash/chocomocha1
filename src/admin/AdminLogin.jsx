import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import styles from './Admin.module.css'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const r = await fetch(api('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (r.ok) {
      sessionStorage.setItem('dxadmin', '1')
      navigate('/admin')
    } else {
      const d = await r.json()
      setError(d.error || 'Алдаа гарлаа')
    }
    setLoading(false)
  }

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginBox} onSubmit={handleSubmit}>
        <h1 className={styles.loginTitle}>DX<span>KINO</span></h1>
        <p className={styles.loginSub}>Админ нэвтрэх</p>
        {error && <div className={styles.error}>{error}</div>}
        <input
          type="password"
          placeholder="Нууц үг"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
        </button>
      </form>
    </div>
  )
}
