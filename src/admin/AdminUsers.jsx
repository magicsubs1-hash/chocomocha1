import { useState, useEffect } from 'react'
import { api } from '../api'
import styles from './Admin.module.css'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [tab, setTab] = useState('payments')
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    Promise.all([
      fetch(api('/api/admin/users')).then(r => r.json()),
      fetch(api('/api/admin/payments')).then(r => r.json())
    ]).then(([u, p]) => {
      setUsers(u)
      setPayments(p)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(load, [])

  async function confirmPayment(id) {
    if (!confirm('Энэ төлбөрийг баталгаажуулах уу? Хэрэглэгчийн эрх идэвхжинэ.')) return
    await fetch(api(`/api/admin/payment/${id}/confirm`), { method: 'POST' })
    load()
  }

  async function rejectPayment(id) {
    if (!confirm('Энэ төлбөрийг цуцлах уу?')) return
    await fetch(api(`/api/admin/payment/${id}/reject`), { method: 'POST' })
    load()
  }

  const now = Math.floor(Date.now() / 1000)

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts * 1000).toLocaleString('mn-MN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function planLabel(plan) {
    const map = { '1month': '1 Сар', '3month': '3 Сар', '12month': '1 Жил' }
    return map[plan] || plan
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Хэрэглэгчид & Төлбөр</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'payments' ? styles.tabActive : ''}`}
          onClick={() => setTab('payments')}
        >
          Төлбөрийн хүсэлтүүд
        </button>
        <button
          className={`${styles.tab} ${tab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setTab('users')}
        >
          Бүх хэрэглэгчид
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : tab === 'payments' ? (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Хэрэглэгч</th>
                <th>Багц</th>
                <th>Дүн</th>
                <th>Утга</th>
                <th>Төлөв</th>
                <th>Огноо</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <div className={styles.movieTitle}>{p.user_name || '—'}</div>
                    <div className={styles.movieTitleEn}>{p.user_email}</div>
                  </td>
                  <td>{planLabel(p.plan)}</td>
                  <td><strong>₮{p.amount?.toLocaleString()}</strong></td>
                  <td className={styles.dateCell}>{p.invoice_id || '—'}</td>
                  <td>
                    <span className={
                      p.status === 'paid' ? styles.badgeGreen
                      : p.status === 'rejected' ? styles.badgeGray
                      : styles.badgeYellow
                    }>
                      {p.status === 'paid' ? 'Баталсан' : p.status === 'rejected' ? 'Цуцалсан' : 'Хүлээгдэж буй'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{formatDate(p.created_at)}</td>
                  <td>
                    {p.status === 'pending' && (
                      <div className={styles.rowActions}>
                        <button className={styles.btnEdit} onClick={() => confirmPayment(p.id)}>Батлах</button>
                        <button className={styles.btnDelete} onClick={() => rejectPayment(p.id)}>Цуцлах</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className={styles.empty}>Төлбөр байхгүй байна</p>}
        </div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Нэр</th>
                <th>И-мэйл</th>
                <th>Утас</th>
                <th>Эрх</th>
                <th>Дуусах</th>
                <th>Бүртгүүлсэн</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const active = u.sub_until > now
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.name || '—'}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={active ? styles.badgeGreen : styles.badgeGray}>
                        {active ? 'Идэвхтэй' : 'Дууссан'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {u.sub_until > 0 ? formatDate(u.sub_until) : '—'}
                    </td>
                    <td className={styles.dateCell}>{formatDate(u.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 && <p className={styles.empty}>Хэрэглэгч байхгүй байна</p>}
        </div>
      )}
    </div>
  )
}
