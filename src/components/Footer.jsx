import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.links}>
          <Link to="/">Нүүр хуудас</Link>
          <Link to="/movies">Кинонууд</Link>
        </div>
        <p className={styles.copy}>
          <span className={styles.logo}>DX<span>KINO</span></span>
          <br />
          © 2025 DXKino. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </div>
    </footer>
  )
}
