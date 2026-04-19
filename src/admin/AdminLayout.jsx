import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import styles from './Admin.module.css'

const navItems = [
  { to: '/admin', label: 'Хянах самбар', icon: '◼' },
  { to: '/admin/movies', label: 'Кинонууд', icon: '🎬' },
  { to: '/admin/users', label: 'Хэрэглэгчид', icon: '👤' },
  { to: '/admin/sliders', label: 'Слайд', icon: '🖼' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  function logout() {
    sessionStorage.removeItem('dxadmin')
    navigate('/admin/login')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>DX<span>KINO</span></div>
        <nav className={styles.sideNav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className={styles.logout} onClick={logout}>Гарах</button>
      </aside>
      <main className={styles.adminMain}>
        <Outlet />
      </main>
    </div>
  )
}
