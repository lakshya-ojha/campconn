import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Video, Users, Shuffle, Settings, LogOut,
  ChevronDown, Sparkles, Wifi, UserPlus
} from 'lucide-react'
import { CAMPUSES, getCampusById } from '../data/campuses.js'
import './Lobby.css'

export default function Lobby({ user, onLogout, friends }) {
  const navigate = useNavigate()
  const [selectedCampus, setSelectedCampus] = useState(user.campusId || '')
  const [matchMode, setMatchMode] = useState('same') // 'same' | 'any'
  const [showCampusDropdown, setShowCampusDropdown] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const dropdownRef = useRef(null)

  const currentCampus = getCampusById(selectedCampus)
  const isCampusSelected = !!selectedCampus

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCampusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Camera preview
  const videoRef = useRef(null)
  useEffect(() => {
    let stream = null
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
        setIsReady(true)
      })
      .catch(() => {
        setIsReady(true) // Allow proceeding even without camera
      })

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const handleStartChat = () => {
    navigate('/chat', {
      state: {
        campusFilter: matchMode === 'same' ? selectedCampus : 'any',
      }
    })
  }

  return (
    <div className="lobby page">
      {/* Top bar */}
      <header className="lobby-header glass">
        <div className="lobby-header-inner container">
          <Link to="/lobby" className="nav-brand">
            <div className="brand-icon">
              <Video size={18} />
            </div>
            <span className="brand-text">CampConn</span>
          </Link>

          <div className="lobby-header-right">
            <Link to="/friends" className="btn btn-ghost btn-sm" id="friends-link">
              <UserPlus size={16} />
              Friends
              {friends.length > 0 && (
                <span className="friends-count">{friends.length}</span>
              )}
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={onLogout} id="logout-btn">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="lobby-main container">
        <div className="lobby-grid">
          {/* Left: Camera preview */}
          <div className="lobby-preview animate-fade-in-up">
            <div className="camera-container glass-card">
              <video
                ref={videoRef}
                className="camera-video"
                autoPlay
                muted
                playsInline
              />
              <div className="camera-overlay">
                <div className="camera-badge badge badge-online">Live Preview</div>
                <div className="camera-user-info">
                  <span className="camera-name">{user.name}</span>
                  <span className="camera-campus">{currentCampus.name}</span>
                </div>
              </div>
              {!videoRef.current?.srcObject && (
                <div className="camera-placeholder">
                  <Video size={48} />
                  <p>Camera preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="lobby-controls animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="lobby-greeting">
              <h1 className="greeting-text">
                Hey, <span className="gradient-text">{user.name}</span> 👋
              </h1>
              <p className="greeting-sub">Ready to meet someone new?</p>
            </div>

            {/* Campus selector */}
            <div className="control-section">
              <label className="control-label">
                <Settings size={14} />
                Your Campus
              </label>
              <div className="campus-selector" ref={dropdownRef}>
                <button
                  className={`campus-selected glass-card ${!isCampusSelected ? 'placeholder' : ''}`}
                  onClick={() => setShowCampusDropdown(!showCampusDropdown)}
                  id="campus-dropdown-btn"
                >
                  {isCampusSelected ? (
                    <>
                      <div
                        className="campus-dot"
                        style={{ background: currentCampus.color }}
                      />
                      <div className="campus-selected-info">
                        <span className="campus-selected-name">{currentCampus.name}</span>
                        <span className="campus-selected-location">{currentCampus.location}</span>
                      </div>
                    </>
                  ) : (
                    <span className="campus-placeholder-text">Select a campus</span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`chevron ${showCampusDropdown ? 'open' : ''}`}
                  />
                </button>

                {showCampusDropdown && (
                  <div className="campus-dropdown glass animate-scale-in">
                    <button
                      className="campus-option placeholder"
                      onClick={() => {
                        setSelectedCampus('')
                        setShowCampusDropdown(false)
                        const updated = { ...user, campusId: '' }
                        localStorage.setItem('campconn_user', JSON.stringify(updated))
                      }}
                    >
                      <span>Select a campus</span>
                    </button>
                    {CAMPUSES.map(c => (
                      <button
                        key={c.id}
                        className={`campus-option ${c.id === selectedCampus ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCampus(c.id)
                          setShowCampusDropdown(false)
                          // Update user campus in localStorage
                          const updated = { ...user, campusId: c.id }
                          localStorage.setItem('campconn_user', JSON.stringify(updated))
                        }}
                      >
                        <div className="campus-dot" style={{ background: c.color }} />
                        <div className="campus-option-info">
                          <span className="campus-option-name">{c.name}</span>
                          <span className="campus-option-location">{c.location}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Match mode */}
            <div className="control-section">
              <label className="control-label">
                <Shuffle size={14} />
                Match With
              </label>
              <div className="match-modes">
                <button
                  className={`match-mode glass-card ${matchMode === 'same' ? 'active' : ''}`}
                  onClick={() => setMatchMode('same')}
                  id="match-same-campus"
                >
                  <Users size={20} />
                  <span>Same Campus</span>
                  <small>Meet people from your campus</small>
                </button>
                <button
                  className={`match-mode glass-card ${matchMode === 'any' ? 'active' : ''}`}
                  onClick={() => setMatchMode('any')}
                  id="match-any-campus"
                >
                  <Sparkles size={20} />
                  <span>Any Campus</span>
                  <small>Meet anyone from all campuses</small>
                </button>
              </div>
            </div>

            {/* Start button */}
            <button
              className="start-btn btn btn-primary btn-lg"
              onClick={handleStartChat}
              id="start-chat-btn"
              disabled={!isCampusSelected}
            >
              <Wifi size={20} />
              Start Matching
            </button>

            <p className="lobby-tip">
              💡 Tip: You can add someone as a friend during the chat if your vibes match!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
