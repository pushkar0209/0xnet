# 0Xnet – ZeroNet

**0Xnet** is an offline-first local network application that enables devices on the same LAN to stream media and communicate in real-time without internet access.

## Features

- **LAN Chat**: Real-time messaging using WebSockets.
- **Synced Video Playback**: Watch pre-recorded videos in sync with other devices (Play/Pause/Seek).
- **Live Broadcasting**: broadcast your camera feed to other devices on the network using WebRTC.
- **Device Discovery**: Automatic server discovery via mDNS.
- **Modern UI**: A premium, responsive interface featuring Glassmorphism design properties.

## Tech Stack

- **Frontend**: React, Vite, Socket.io-client, Video.js
- **Backend**: Node.js, Express, Socket.io, Bonjour-service (mDNS)

## Prerequisites

-   Node.js (v18 or higher)
-   npm (Node Package Manager)

## Quick Start

### 1. Start the Server
The backend handles signaling and discovery.
```bash
cd server
npm install
npm run dev
```
*The server will log your LAN IP address (e.g., `http://192.168.1.5:3000`).*

### 2. Start the Client
The frontend provides the user interface.
```bash
cd client
npm install
npm run dev
```
*Access the app at `http://localhost:5173`.*

### 3. Connect Other Devices
To connect from another device (phone, laptop) on the same Wi-Fi:
1.  Note the **Network URL** shown in the Client terminal (e.g., `http://192.168.1.5:5173`).
2.  Open that URL in the other device's browser.
3.  Join the chat or watch the stream!

## Project Structure

```
0xnet/
├── server/       # Node.js Backend
│   ├── services/ # Discovery services
│   └── utils/    # Helper utilities
└── client/       # React Frontend
    ├── src/
    │   ├── components/ # UI Components (Chat, Video, etc.)
    │   └── context/    # Global State (Socket)
    └── public/
```

