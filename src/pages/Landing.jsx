import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, Users, Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react'
import { CAMPUSES, generateUserId } from '../data/campuses.js'
import './Landing.css'

export default function Landing({ onJoin }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [campus, setCampus] = useState('')
  const [step, setStep] = useState('hero') // 'hero' | 'join'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !campus) return

    const userData = {
      id: generateUserId(),
      name: name.trim(),
      campusId: campus,
      joinedAt: Date.now(),
    }
    onJoin(userData)
    navigate('/lobby')
  }

  return (
    <div className="landing page">
      {/* Floating orbs background */}
      <div className="landing-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Nav */}
      <nav className="landing-nav container">
        <div className="nav-brand">
          <div className="brand-icon">
            <Video size={20} />
          </div>
          <span className="brand-text">CampConn</span>
        </div>
        <div className="nav-badge badge badge-accent">
          <Sparkles size={12} />
          Campus Video Chat
        </div>
      </nav>

      {step === 'hero' && (
        <main className="landing-hero container animate-fade-in-up">
          <div className="hero-content">
            <div className="hero-tag badge badge-accent">
              <Zap size={12} />
              Random Video Chat for Campuses
            </div>

            <h1 className="hero-title">
              Meet your
              <span className="gradient-text"> campus crew</span>
              <br />in seconds
            </h1>

            <p className="hero-description">
              Connect with students across campuses through instant video chat.
              Make friends, share vibes, build your network — one call at a time.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStep('join')}
                id="get-started-btn"
              >
                Get Started
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-icon">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="stat-value">{CAMPUSES.length}</div>
                  <div className="stat-label">Campuses</div>
                </div>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <div className="stat-icon">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="stat-value">Secure</div>
                  <div className="stat-label">P2P Encrypted</div>
                </div>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <div className="stat-icon">
                  <Users size={16} />
                </div>
                <div>
                  <div className="stat-value">Instant</div>
                  <div className="stat-label">Matching</div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating preview card */}
          <div className="hero-visual">
            <div className="preview-card glass-card">
              <div className="preview-video">
                <Video size={40} className="preview-icon" />
                <div className="preview-pulse" />
              </div>
              <div className="preview-info">
                <div className="preview-name">Connecting...</div>
                <div className="preview-campus">Campus Preview</div>
              </div>
            </div>
          </div>
        </main>
      )}

      {step === 'join' && (
        <main className="landing-join container animate-scale-in">
          <button
            className="back-btn btn btn-ghost"
            onClick={() => setStep('hero')}
          >
            ← Back
          </button>

          <div className="join-card glass-card">
            <div className="join-header">
              <div className="brand-icon lg">
                <Video size={24} />
              </div>
              <h2 className="join-title">Join CampConn</h2>
              <p className="join-subtitle">Enter your details to start connecting</p>
            </div>

            <form onSubmit={handleSubmit} className="join-form">
              <div className="input-group">
                <label htmlFor="name-input">Your Name</label>
                <input
                  id="name-input"
                  className="input"
                  type="text"
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  autoFocus
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="campus-select">Your Campus</label>
                <select
                  id="campus-select"
                  className="select"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a campus</option>
                  {CAMPUSES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg join-submit"
                disabled={!name.trim() || !campus}
                id="join-btn"
              >
                <Video size={18} />
                Start Connecting
              </button>
            </form>

            <p className="join-disclaimer">
              By joining, you agree to be respectful. CampConn is about building genuine connections.
            </p>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="landing-footer container">
        <span>Made with ❤️ for campus connections</span>
        <span className="footer-dot">·</span>
        <span>CampConn © 2026</span>
      </footer>
    </div>
  )
}
