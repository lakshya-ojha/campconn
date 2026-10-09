import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import Landing from './pages/Landing.jsx'
import Lobby from './pages/Lobby.jsx'
import ChatRoom from './pages/ChatRoom.jsx'
import Friends from './pages/Friends.jsx'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campconn_user')
    return saved ? JSON.parse(saved) : null
  })

  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('campconn_friends')
    return saved ? JSON.parse(saved) : []
  })

  const handleJoin = useCallback((userData) => {
    setUser(userData)
    localStorage.setItem('campconn_user', JSON.stringify(userData))
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('campconn_user')
  }, [])

  const addFriend = useCallback((friend) => {
    setFriends(prev => {
      const exists = prev.some(f => f.id === friend.id)
      if (exists) return prev
      const updated = [...prev, { ...friend, addedAt: Date.now() }]
      localStorage.setItem('campconn_friends', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeFriend = useCallback((friendId) => {
    setFriends(prev => {
      const updated = prev.filter(f => f.id !== friendId)
      localStorage.setItem('campconn_friends', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <div className="app">
      {/* Background ambient glow */}
      <div className="ambient-glow" />

      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/lobby" replace /> : <Landing onJoin={handleJoin} />
          }
        />
        <Route
          path="/lobby"
          element={
            user ? (
              <Lobby user={user} onLogout={handleLogout} friends={friends} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/chat"
          element={
            user ? (
              <ChatRoom user={user} addFriend={addFriend} friends={friends} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/friends"
          element={
            user ? (
              <Friends
                user={user}
                friends={friends}
                removeFriend={removeFriend}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </div>
  )
}

export default App
