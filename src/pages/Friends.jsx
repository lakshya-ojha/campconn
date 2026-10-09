import { Link } from 'react-router-dom'
import {
  Video, ArrowLeft, UserMinus, Users, Heart,
  Sparkles, LogOut
} from 'lucide-react'
import { getCampusById } from '../data/campuses.js'
import './Friends.css'

export default function Friends({ user, friends, removeFriend, onLogout }) {
  return (
    <div className="friends page">
      {/* Header */}
      <header className="lobby-header glass">
        <div className="lobby-header-inner container">
          <Link to="/lobby" className="nav-brand">
            <div className="brand-icon">
              <Video size={18} />
            </div>
            <span className="brand-text">CampConn</span>
          </Link>

          <div className="lobby-header-right">
            <Link to="/lobby" className="btn btn-ghost btn-sm">
              <ArrowLeft size={16} />
              Lobby
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="friends-main container">
        <div className="friends-header animate-fade-in-up">
          <h1 className="friends-title">
            <Heart size={24} className="title-icon" />
            Your <span className="gradient-text">Vibes</span>
          </h1>
          <p className="friends-subtitle">
            People you connected with. Your campus network keeps growing!
          </p>
        </div>

        {friends.length === 0 ? (
          <div className="friends-empty animate-fade-in-up">
            <div className="empty-illustration">
              <Users size={48} />
              <div className="empty-sparkle">
                <Sparkles size={20} />
              </div>
            </div>
            <h3>No friends yet</h3>
            <p>Start chatting and add people you vibe with! Hit the <strong>Add Friend</strong> button during a call.</p>
            <Link to="/lobby" className="btn btn-primary">
              <Video size={16} />
              Start Matching
            </Link>
          </div>
        ) : (
          <div className="friends-list">
            <div className="friends-count">
              <span className="badge badge-accent">
                <Users size={12} />
                {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
              </span>
            </div>

            <div className="friends-grid">
              {friends.map((friend, index) => {
                const campus = getCampusById(friend.campusId)
                return (
                  <div
                    key={friend.id}
                    className="friend-card glass-card animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="friend-avatar" style={{ background: campus?.color || '#6366f1' }}>
                      {friend.name[0].toUpperCase()}
                    </div>

                    <div className="friend-info">
                      <div className="friend-name">{friend.name}</div>
                      <div className="friend-campus">
                        <span
                          className="friend-campus-dot"
                          style={{ background: campus?.color }}
                        />
                        {friend.campusName || campus?.name}
                      </div>
                      {friend.addedAt && (
                        <div className="friend-date">
                          Added {new Date(friend.addedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-ghost btn-icon sm friend-remove"
                      onClick={() => removeFriend(friend.id)}
                      title="Remove friend"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
