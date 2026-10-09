import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../dist')))

// Catch-all route to serve index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// In-memory state
const waitingUsers = new Map()   // campusFilter -> [socket]
const activeChats = new Map()    // socketId -> partnerId
const connectedUsers = new Map() // socketId -> user data

console.log('🏕️  CampConn Signaling Server starting...')

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`)

  // User joins with their info
  socket.on('join', (userData) => {
    connectedUsers.set(socket.id, {
      ...userData,
      socketId: socket.id,
    })
    console.log(`👤 ${userData.name} joined from ${userData.campusId}`)
    io.emit('onlineCount', connectedUsers.size)
  })

  // Start searching for a match
  socket.on('search', ({ campusFilter }) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return

    console.log(`🔍 ${user.name} searching (filter: ${campusFilter})`)

    // Try to find a match
    let matched = false

    for (const [filter, queue] of waitingUsers.entries()) {
      for (let i = 0; i < queue.length; i++) {
        const waitingSocket = queue[i]
        const waitingUser = connectedUsers.get(waitingSocket.id)

        if (!waitingUser || waitingSocket.id === socket.id) continue
        if (waitingSocket.disconnected) {
          queue.splice(i, 1)
          i--
          continue
        }

        // Check campus filter compatibility
        const canMatch =
          (campusFilter === 'any' || filter === 'any') ||
          (campusFilter === waitingUser.campusId) ||
          (filter === user.campusId)

        if (canMatch) {
          // Match found!
          queue.splice(i, 1)
          if (queue.length === 0) waitingUsers.delete(filter)

          activeChats.set(socket.id, waitingSocket.id)
          activeChats.set(waitingSocket.id, socket.id)

          socket.emit('matched', {
            peer: {
              id: waitingUser.id,
              name: waitingUser.name,
              campusId: waitingUser.campusId,
            },
            initiator: true,
          })

          waitingSocket.emit('matched', {
            peer: {
              id: user.id,
              name: user.name,
              campusId: user.campusId,
            },
            initiator: false,
          })

          console.log(`🤝 Matched: ${user.name} <-> ${waitingUser.name}`)
          matched = true
          break
        }
      }
      if (matched) break
    }

    if (!matched) {
      // Remove from any queue first to prevent duplicates
      for (const queue of waitingUsers.values()) {
        const idx = queue.findIndex(s => s.id === socket.id)
        if (idx !== -1) queue.splice(idx, 1)
      }

      // Add to waiting queue
      if (!waitingUsers.has(campusFilter)) {
        waitingUsers.set(campusFilter, [])
      }
      waitingUsers.get(campusFilter).push(socket)
      console.log(`⏳ ${user.name} added to waiting queue (${campusFilter})`)
    }
  })

  // WebRTC signaling
  socket.on('signal', (data) => {
    const partnerId = activeChats.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit('signal', data)
    }
  })

  // Chat messages
  socket.on('chatMessage', (message) => {
    const partnerId = activeChats.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit('chatMessage', message)
    }
  })

  // Skip / next
  socket.on('skip', () => {
    const partnerId = activeChats.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit('peerSkipped')
      activeChats.delete(partnerId)
    }
    activeChats.delete(socket.id)
  })

  // Disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    console.log(`❌ User disconnected: ${user?.name || socket.id}`)

    // Notify partner
    const partnerId = activeChats.get(socket.id)
    if (partnerId) {
      io.to(partnerId).emit('peerDisconnected')
      activeChats.delete(partnerId)
    }
    activeChats.delete(socket.id)

    // Remove from waiting queues
    for (const [filter, queue] of waitingUsers.entries()) {
      const idx = queue.findIndex(s => s.id === socket.id)
      if (idx !== -1) {
        queue.splice(idx, 1)
        if (queue.length === 0) waitingUsers.delete(filter)
      }
    }

    connectedUsers.delete(socket.id)
    io.emit('onlineCount', connectedUsers.size)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 CampConn signaling server running on port ${PORT}`)
  console.log(`   Waiting for connections...`)
})
