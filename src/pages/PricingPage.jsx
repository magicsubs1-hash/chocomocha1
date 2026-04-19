import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './PricingPage.module.css'

export default function PricingPage() {
  const { user, token, loading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [payment, setPayment] = useState(null)
  const [checking, setChecking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) { navigate('/login'); return }
    fetch(api('/api/plans')).then(r => r.json()).then(setPlans).catch(() => {})
  }, [loading, user])

  useEffect(() => {
    return () => clearInterval(pollRef.current)
  }, [])

  if (loading) return null
  if (!user) return null

  if (user.is_subscribed || success) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.checkIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="48" height="48">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h1>Эрх амжилттай идэвхжлээ!</h1>
          <p className={styles.subInfo}>
            Таны эрх <strong>{user.days_left || 30} хоног</strong> үлдсэн
          </p>
          <button className={styles.btnWatch} onClick={() => navigate('/')}>
            Кино үзэх →
          </button>
        </div>
      </div>
    )
  }

  async function handlePay(planKey) {
    setError('')
    setPayment(null)

    const r = await fetch(api('/api/payment/create'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: planKey })
    })
    const data = await r.json()
    if (!r.ok) { setError(data.error || 'Алдаа'); return }
    setPayment(data)
    startPolling(data.payment_id)
  }

  function startPolling(paymentId) {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const r = await fetch(api(`/api/payment/check/${paymentId}`), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (d.status === 'paid') {
        clearInterval(pollRef.current)
        await refreshUser()
        setSuccess(true)
      }
    }, 4000)
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className={styles.page}>
      {!payment ? (
        <>
          <div className={styles.header}>
            <h1>Багц сонгох</h1>
            <p>Бүх кино хязгааргүй үзээрэй</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.plans}>
            {plans.map(p => (
              <div
                key={p.key}
                className={`${styles.plan} ${p.key === '3month' ? styles.popular : ''}`}
                onClick={() => handlePay(p.key)}
              >
                {p.key === '3month' && <span className={styles.popularBadge}>Түгээмэл</span>}
                <h2>{p.name}</h2>
                <div className={styles.price}>
                  <span className={styles.amount}>₮{p.price.toLocaleString()}</span>
                </div>
                <p className={styles.planDesc}>{p.desc}</p>
                <button className={styles.btnSelect}>Сонгох</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.paymentBox}>
          <h2>Төлбөр шилжүүлэх</h2>
          <p className={styles.paymentPlan}>{payment.plan} — ₮{payment.amount?.toLocaleString()}</p>

          {/* QR */}
          <div className={styles.qrWrap}>
            <img src={payment.qr_image} alt="QR" className={styles.qr} />
          </div>

          {/* Банкны мэдээлэл */}
          <div className={styles.bankInfo}>
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>Банк</span>
              <span className={styles.bankValue}>{payment.bank_name}</span>
            </div>
            <div className={styles.bankRow} onClick={() => copyText(payment.bank_account)}>
              <span className={styles.bankLabel}>Дансны дугаар</span>
              <span className={styles.bankValue}>{payment.bank_account} <span className={styles.copy}>📋</span></span>
            </div>
            <div className={styles.bankRow}>
              <span className={styles.bankLabel}>Хүлээн авагч</span>
              <span className={styles.bankValue}>{payment.bank_account_name}</span>
            </div>
            <div className={styles.bankRow} onClick={() => copyText(String(payment.amount))}>
              <span className={styles.bankLabel}>Шилжүүлэх дүн</span>
              <span className={styles.bankValueBig}>₮{payment.amount?.toLocaleString()} <span className={styles.copy}>📋</span></span>
            </div>
            <div className={styles.bankRow} onClick={() => copyText(payment.ref)}>
              <span className={styles.bankLabel}>Гүйлгээний утга</span>
              <span className={styles.bankValueRef}>{payment.ref} <span className={styles.copy}>📋</span></span>
            </div>
          </div>

          <div className={styles.notice}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            Гүйлгээ хийсний дараа бид шалгаад таны эрхийг идэвхжүүлнэ
          </div>

          <div className={styles.waiting}>
            <div className={styles.waitDot} />
            Төлбөр хүлээж байна...
          </div>

          <button className={styles.btnBack} onClick={() => { clearInterval(pollRef.current); setPayment(null) }}>
            ← Багц солих
          </button>
        </div>
      )}
    </div>
  )
}
