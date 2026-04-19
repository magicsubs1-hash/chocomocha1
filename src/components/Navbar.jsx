import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function close(e) { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setQuery(''); setSearchOpen(false) }
  }

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>DX<span>KINO</span></Link>
        <Link to="/" className={location.pathname === '/' ? styles.activeLink : styles.link}>Нүүр</Link>
        <Link to="/movies" className={location.pathname.startsWith('/movie') ? styles.activeLink : styles.link}>Кинонууд</Link>
      </div>

      <div className={styles.right}>
        {/* Search */}
        <div className={styles.searchWrap}>
          {searchOpen ? (
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} onBlur={() => !query && setSearchOpen(false)} placeholder="Нэр, жүжигчин, жанр" />
            </form>
          ) : (
            <button className={styles.iconBtn} onClick={() => setSearchOpen(true)} aria-label="search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
          )}
        </div>

        {user ? (
          <div className={styles.profileWrap} ref={profileRef}>
            {!user.is_subscribed && <Link to="/pricing" className={styles.subPill}>Эрх авах</Link>}
            <button className={styles.avatar} onClick={() => setProfileOpen(p => !p)}>
              <span>{(user.name || user.email)[0].toUpperCase()}</span>
              <svg className={`${styles.caret} ${profileOpen ? styles.caretUp : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
            {profileOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownUser}>
                  <div className={styles.dropdownAvatar}>{(user.name || user.email)[0].toUpperCase()}</div>
                  <div>
                    <div className={styles.dropdownName}>{user.name || user.email}</div>
                    <div className={styles.dropdownEmail}>{user.email}</div>
                  </div>
                </div>
                <div className={styles.dropdownDivider} />
                {user.is_subscribed && <div className={styles.dropdownItem}>Эрх: {user.days_left} хоног</div>}
                <button className={styles.dropdownItem} onClick={() => { logout(); navigate('/'); setProfileOpen(false) }}>
                  Гарах
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className={styles.signInBtn}>Нэвтрэх</Link>
        )}
      </div>
    </nav>
  )
}
