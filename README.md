# CampConn 🏕️

A sleek, real-time, WebRTC-powered video and text chat platform exclusively designed for college campuses. Built with a highly refined, mature monochrome aesthetic, CampConn allows students to connect, interact, and vibe with their peers across different universities. 

Designed and optimized for campus fests, this platform makes networking fast, anonymous, and fun.

## ✨ Features

- **P2P Video Chat**: Lightning-fast, low-latency video and audio powered by WebRTC.
- **Real-Time Messaging**: Built-in text chat powered by Socket.io.
- **Campus Matchmaking**: Filter connections to only meet students from specific campuses (e.g., CGC Landran, Chandigarh University).
- **Mature Monochrome Theme**: A highly refined, Swiss-inspired brutalist/pixel design with a sleek dark mode.
- **Friends System**: Add connections and chat with them later.
- **Robust Connection Handling**: Features an ICE candidate queue and NAT traversal via OpenRelay TURN servers for flawless mobile and cross-network connections.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, React Router v7
- **Backend**: Node.js, Express, Socket.io
- **Signaling & Chat**: Custom Socket.io events
- **P2P Connectivity**: Native WebRTC APIs (RTCPeerConnection)
- **Styling**: Custom CSS variables, `Inter` and `Pixelify Sans` Google Fonts.

## 🛠️ Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server** (Runs Vite and the Node backend proxy)
   ```bash
   npm run dev
   ```

3. **Start the signaling server**
   ```bash
   npm run server
   ```

## 🌍 Production Hosting (Render/Railway)

The codebase is pre-configured to host both the React frontend and the Express WebSockets API from a single Node.js instance.

1. Set the **Build Command**: `npm install && npm run build`
2. Set the **Start Command**: `npm start`
3. The server will automatically serve the static `dist/` frontend on the same port as the Socket.io API!

## 📜 License
MIT
