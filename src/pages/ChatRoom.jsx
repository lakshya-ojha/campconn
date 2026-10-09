import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, SkipForward,
  UserPlus, UserCheck, MessageSquare, Send, ArrowLeft,
  Loader, X
} from 'lucide-react'
import { getCampusById } from '../data/campuses.js'
import './ChatRoom.css'

export default function ChatRoom({ user, addFriend, friends }) {
  const navigate = useNavigate()
  const location = useLocation()
  const campusFilter = location.state?.campusFilter || 'any'

  // State
  const [status, setStatus] = useState('searching') // searching | connected
  const [peer, setPeer] = useState(null)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatDuration, setChatDuration] = useState(0)
  const [isFriendAdded, setIsFriendAdded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasRemoteStream, setHasRemoteStream] = useState(false)

  // Refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const timerRef = useRef(null)
  const chatEndRef = useRef(null)
  
  const socketRef = useRef(null)
  const peerConnectionRef = useRef(null)

  // STUN servers for WebRTC
  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  }

  const showChatRef = useRef(showChat)
  useEffect(() => {
    showChatRef.current = showChat
  }, [showChat])

  // Initialize camera & Socket
  useEffect(() => {
    // 1. Get Camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // 2. Connect Socket only after camera is ready
        connectSocket()
      })
      .catch(err => {
        console.error('Camera access denied or error:', err)
        // If camera fails, we might still want to connect, but usually WebRTC needs a stream. 
        // For now, we will connect anyway.
        connectSocket()
      })

    return () => {
      cleanupConnection()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connectSocket = () => {
    socketRef.current = io()
    
    // Join and Search
    socketRef.current.emit('join', user)
    startSearch()

    // Socket Events
    socketRef.current.on('matched', async ({ peer: matchedPeer, initiator }) => {
      setPeer(matchedPeer)
      setStatus('connected')
      setIsFriendAdded(friends.some(f => f.id === matchedPeer.id))
      setMessages([])
      setChatDuration(0)
      setUnreadCount(0)

      startTimer()
      setupWebRTC(initiator)
    })

    socketRef.current.on('signal', async (data) => {
      const pc = peerConnectionRef.current
      if (!pc) return

      try {
        if (data.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socketRef.current.emit('signal', pc.localDescription)
          
          // Process queued candidates
          if (pc.iceQueue) {
            for (const candidate of pc.iceQueue) {
              await pc.addIceCandidate(candidate)
            }
            pc.iceQueue = []
          }
        } else if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data))
          
          // Process queued candidates
          if (pc.iceQueue) {
            for (const candidate of pc.iceQueue) {
              await pc.addIceCandidate(candidate)
            }
            pc.iceQueue = []
          }
        } else if (data.candidate) {
          const candidate = new RTCIceCandidate(data)
          if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate)
          } else {
            pc.iceQueue = pc.iceQueue || []
            pc.iceQueue.push(candidate)
          }
        }
      } catch (err) {
        console.error('WebRTC signal error:', err)
      }
    })

    socketRef.current.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'peer',
        text: msg,
        timestamp: Date.now(),
      }])
      if (!showChatRef.current) {
        setUnreadCount(prev => prev + 1)
      }
    })

    socketRef.current.on('peerSkipped', () => {
      resetForNextMatch()
    })

    socketRef.current.on('peerDisconnected', () => {
      resetForNextMatch()
    })
  }

  const setupWebRTC = async (initiator) => {
    peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS)
    const pc = peerConnectionRef.current

    // Add local tracks to connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current)
      })
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', event.candidate)
      }
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
        setHasRemoteStream(true)
      }
    }

    if (initiator) {
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socketRef.current.emit('signal', pc.localDescription)
      } catch (err) {
        console.error('Error creating offer:', err)
      }
    }
  }

  const startSearch = () => {
    setStatus('searching')
    setPeer(null)
    socketRef.current?.emit('search', { campusFilter })
  }

  const resetForNextMatch = () => {
    cleanupWebRTC()
    clearInterval(timerRef.current)
    setMessages([])
    setShowChat(false)
    setHasRemoteStream(false)
    startSearch()
  }

  const cleanupWebRTC = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
  }

  const cleanupConnection = () => {
    cleanupWebRTC()
    clearInterval(timerRef.current)
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
  }

  const startTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setChatDuration(prev => prev + 1)
    }, 1000)
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset unread when chat opens
  useEffect(() => {
    if (showChat) setUnreadCount(0)
  }, [showChat])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioOn(audioTrack.enabled)
      }
    }
  }

  const handleSkip = () => {
    if (socketRef.current) {
      socketRef.current.emit('skip')
    }
    resetForNextMatch()
  }

  const handleEnd = () => {
    cleanupConnection()
    navigate('/lobby')
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const msgText = chatInput.trim()
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'self',
      text: msgText,
      timestamp: Date.now(),
    }])
    
    if (socketRef.current) {
      socketRef.current.emit('chatMessage', msgText)
    }
    
    setChatInput('')
  }

  const handleAddFriend = () => {
    if (peer && !isFriendAdded) {
      addFriend({
        id: peer.id,
        name: peer.name,
        campusId: peer.campusId,
        campusName: getCampusById(peer.campusId)?.name,
      })
      setIsFriendAdded(true)
    }
  }

  return (
    <div className="chatroom page">
      {/* Top bar */}
      <header className="chat-header glass">
        <div className="chat-header-inner">
          <button className="btn btn-ghost btn-sm" onClick={handleEnd} id="back-to-lobby">
            <ArrowLeft size={16} />
            <span className="hide-mobile">Back</span>
          </button>

          <div className="chat-header-center">
            {status === 'connected' && peer && (
              <>
                <div className="badge badge-online">Connected</div>
                <span className="chat-timer">{formatTime(chatDuration)}</span>
              </>
            )}
            {status === 'searching' && (
              <div className="badge badge-accent">
                <Loader size={12} className="spinning" />
                Searching...
              </div>
            )}
          </div>

          <div className="chat-header-right">
            {status === 'connected' && (
              <>
                <button
                  className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setShowChat(!showChat)}
                  id="toggle-chat-btn"
                >
                  <MessageSquare size={16} />
                  {unreadCount > 0 && !showChat && (
                    <span className="unread-badge">{unreadCount}</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Video area */}
      <main className="chat-main">
        {status === 'searching' && (
          <div className="search-overlay animate-fade-in">
            <div className="search-content">
              <div className="search-spinner">
                <div className="spinner-ring" />
                <div className="spinner-ring delay" />
                <Video size={32} className="spinner-icon" />
              </div>
              <h2 className="search-title">Finding someone...</h2>
              <p className="search-subtitle">
                {campusFilter === 'any'
                  ? 'Searching across all campuses'
                  : `Searching in ${getCampusById(campusFilter).name}`
                }
              </p>
            </div>
          </div>
        )}

        <div className="video-grid" style={{ display: status === 'connected' ? 'block' : 'none' }}>
          {/* Remote video (large) */}
          <div className="video-remote">
            <div className="video-container">
              <video
                ref={remoteVideoRef}
                className="remote-video"
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              {!hasRemoteStream && (
                <div className="remote-placeholder">
                  <div className="remote-avatar" style={{ background: getCampusById(peer?.campusId)?.color }}>
                    {peer?.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="remote-name">{peer?.name}</p>
                  <p className="remote-campus">{getCampusById(peer?.campusId)?.name}</p>
                </div>
              )}

              <div className="video-overlay-info">
                <div className="peer-info">
                  <span
                    className="peer-campus-dot"
                    style={{ background: getCampusById(peer?.campusId)?.color }}
                  />
                  <span className="peer-name">{peer?.name}</span>
                  <span className="peer-campus">{getCampusById(peer?.campusId)?.shortName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Local video (PIP) */}
          <div className="video-local">
            <video
              ref={localVideoRef}
              className="local-video"
              autoPlay
              muted
              playsInline
            />
            {!isVideoOn && (
              <div className="video-off-overlay">
                <VideoOff size={20} />
              </div>
            )}
            <div className="local-label">{user.name}</div>
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && status === 'connected' && (
          <div className="chat-sidebar glass animate-slide-in-right">
            <div className="chat-sidebar-header">
              <h3>Chat</h3>
              <button
                className="btn btn-ghost btn-icon sm"
                onClick={() => setShowChat(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">
                  <MessageSquare size={24} />
                  <p>Say something to break the ice! 🧊</p>
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender === 'self' ? 'self' : 'peer'}`}
                >
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              <input
                className="input chat-text-input"
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoFocus
                id="chat-text-input"
              />
              <button
                type="submit"
                className="btn btn-primary btn-icon"
                disabled={!chatInput.trim()}
                id="send-message-btn"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Bottom controls */}
      {status === 'connected' && (
        <div className="chat-controls animate-fade-in-up">
          <div className="controls-inner">
            <button
              className={`btn btn-icon control-btn ${!isAudioOn ? 'off' : ''}`}
              onClick={toggleAudio}
              data-tooltip={isAudioOn ? 'Mute' : 'Unmute'}
              id="toggle-audio-btn"
            >
              {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              className={`btn btn-icon control-btn ${!isVideoOn ? 'off' : ''}`}
              onClick={toggleVideo}
              data-tooltip={isVideoOn ? 'Camera Off' : 'Camera On'}
              id="toggle-video-btn"
            >
              {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              className={`btn control-btn friend-btn ${isFriendAdded ? 'added' : ''}`}
              onClick={handleAddFriend}
              disabled={isFriendAdded}
              id="add-friend-btn"
            >
              {isFriendAdded ? (
                <>
                  <UserCheck size={18} />
                  <span className="hide-mobile">Added!</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span className="hide-mobile">Add Friend</span>
                </>
              )}
            </button>

            <div className="control-divider" />

            <button
              className="btn btn-secondary control-btn skip-btn"
              onClick={handleSkip}
              id="skip-btn"
            >
              <SkipForward size={18} />
              <span className="hide-mobile">Next</span>
            </button>

            <button
              className="btn btn-danger control-btn end-btn"
              onClick={handleEnd}
              id="end-call-btn"
            >
              <PhoneOff size={18} />
              <span className="hide-mobile">End</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
