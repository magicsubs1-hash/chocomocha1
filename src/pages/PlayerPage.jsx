import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './PlayerPage.module.css'

function isHlsUrl(url) {
  return url && (url.includes('.m3u8') || url.includes('stream.mux.com'))
}

function isIframeUrl(url) {
  return url && (
    url.includes('youtube.com/embed') ||
    url.includes('player.vimeo.com') ||
    url.includes('player.mux.com')
  )
}

export default function PlayerPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const epId = searchParams.get('ep')
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [movie, setMovie] = useState(null)
  const [episode, setEpisode] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [authorized, setAuthorized] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [subsOn, setSubsOn] = useState(true)
  const hideTimer = useRef(null)
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  // Нэвтрэлт + эрх шалгах + data авах
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!token) { navigate('/login'); return }

    fetch(api('/api/auth/check-sub'), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(async d => {
        if (!d.subscribed) { navigate('/pricing'); return }
        setAuthorized(true)

        const movieData = await fetch(api(`/api/movies/${slug}`)).then(r => r.json())
        setMovie(movieData)

        // Series бол ангиуд авах
        if (movieData.type === 'series') {
          const eps = await fetch(api(`/api/movies/${movieData.id}/episodes`)).then(r => r.json())
          setEpisodes(eps)
          if (epId) {
            const ep = eps.find(e => e.id === Number(epId))
            setEpisode(ep || eps[0] || null)
          } else if (eps.length > 0) {
            setEpisode(eps[0])
          }
        }
      })
      .catch(() => navigate('/login'))
  }, [slug, epId, user, token])

  // HLS setup
  useEffect(() => {
    const src = episode || movie
    if (!src?.video_url || !isHlsUrl(src.video_url)) return
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(src.video_url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src.video_url
      video.play().catch(() => {})
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  }, [movie, episode])

  // Subtitle toggle
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const track = video.textTracks[0]
    if (track) track.mode = subsOn ? 'showing' : 'hidden'
  }, [subsOn, movie])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  if (!movie) return (
    <div className={styles.loading}><div className={styles.spin} /></div>
  )

  // Episode байвал episode-ийн video, эсвэл movie-ийнх
  const videoSource = episode || movie
  const url = videoSource.video_url
  const hasVideo = url || videoSource.video_file
  const hasSub = Boolean(movie.subtitle)
  const subSrc = hasSub ? api(`/api/subtitle/${movie.subtitle}`) : null

  // Дараагийн анги
  const currentEpIdx = episodes.findIndex(e => e.id === episode?.id)
  const nextEp = currentEpIdx >= 0 ? episodes[currentEpIdx + 1] : null

  // Video элемент рендерлэх (HLS, шууд URL, local файл)
  function renderVideo(src, isHls) {
    return (
      <video
        ref={videoRef}
        className={styles.video}
        controls
        autoPlay={!isHls}
        playsInline
        src={isHls ? undefined : src}
        crossOrigin="anonymous"
      >
        {hasSub && (
          <track
            kind="subtitles"
            src={subSrc}
            srcLang="mn"
            label="Монгол"
            default
          />
        )}
      </video>
    )
  }

  return (
    <div className={styles.page} onMouseMove={handleMouseMove}>
      {/* Top bar */}
      <div className={`${styles.topBar} ${showControls ? styles.visible : ''}`}>
        <Link to={`/movie/${movie.slug || movie.id}`} className={styles.back}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {movie.title}
          {episode && <span className={styles.epLabel}>S{episode.season}:E{episode.episode_num} {episode.title || ''}</span>}
        </Link>

        <div className={styles.topRight}>
          {nextEp && (
            <button className={styles.nextEpBtn} onClick={() => navigate(`/watch/${movie.slug || movie.id}?ep=${nextEp.id}`)}>
              Дараагийн анги ▶
            </button>
          )}

        {/* Subtitle toggle */}
        {hasSub && (
          <button
            className={`${styles.subBtn} ${subsOn ? styles.subOn : ''}`}
            onClick={() => setSubsOn(p => !p)}
            title={subsOn ? 'Хадмал унтраах' : 'Хадмал асаах'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M7 15h4M13 15h4M7 11h10"/>
            </svg>
            {subsOn ? 'CC' : 'CC'}
          </button>
        )}
        </div>
      </div>

      {/* Player */}
      <div className={styles.player}>
        {hasVideo ? (
          isHlsUrl(url)
            ? renderVideo(null, true)
            : isIframeUrl(url)
            ? (
              <iframe
                src={url}
                className={styles.iframe}
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                title={movie.title}
              />
            )
            : url
            ? renderVideo(url, false)
            : renderVideo(api(`/api/uploads/${videoSource.video_file}`), false)
        ) : (
          <div className={styles.noVideo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
            <p>Видео байхгүй байна</p>
            <Link to={`/movie/${movie.slug || movie.id}`} className={styles.backLink}>← Буцах</Link>
          </div>
        )}
      </div>
    </div>
  )
}
