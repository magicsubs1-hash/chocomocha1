import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export default function AuthPage({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { saveAuth } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const url = isLogin ? api('/api/auth/login') : api('/api/auth/register')
    const body = isLogin ? { email, password } : { email, password, name }

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await r.json()

    if (r.ok) {
      saveAuth(data)
      navigate('/')
    } else {
      setError(data.error || 'Алдаа гарлаа')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />
      <div className={styles.box}>
        <h1>{isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Нэр"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="И-мэйл хаяг"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Нууц үг"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            required
            minLength={6}
          />
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Түр хүлээнэ үү...' : isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </button>
        </form>

        <div className={styles.switch}>
          {isLogin ? (
            <p>Шинэ хэрэглэгч үү? <button onClick={() => setIsLogin(false)}>Бүртгүүлэх</button></p>
          ) : (
            <p>Бүртгэлтэй юу? <button onClick={() => setIsLogin(true)}>Нэвтрэх</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
