const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { getLocalIp } = require('./utils/ip');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for local network access
        methods: ["GET", "POST"]
    }
});



app.use(cors());
app.use(express.static('public')); // For serving static files/HLS segments if needed
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename to avoid issues
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// APIs
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200).json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`
    });
});

app.get('/videos', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory');
        }
        // Filter for video extensions if needed, for now just send all files
        const videos = files.map(file => ({
            name: file,
            url: `/uploads/${file}`
        }));
        // Add the sample video if it exists in public root (optional, handling currently in frontend hardcoded)
        // But for consistency we might want to move sample.mp4 or just keep it separate.
        // The frontend currently uses 'http://localhost:3000/sample.mp4'.

        res.json(videos);
    });
});

// Basic Health Check
app.get('/', (req, res) => {
    res.send('0Xnet Server is Running');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Notify others if needed
        socket.broadcast.emit('user-disconnected', socket.id);
    });

    // Chat
    socket.on('chat:message', (msg) => {
        io.emit('chat:message', msg); // Broadcast to all
    });

    // WebRTC Signaling
    socket.on('join-stream', (roomId) => {
        // For now, simplicity: everyone is in the same room or just broadcast to all except sender
        // In a real app, use socket.join(roomId);
        console.log(`User ${socket.id} joining stream`);
        socket.broadcast.emit('user-connected', socket.id);
    });

    socket.on('signal', (data) => {
        // Relay signals (offer, answer, candidate) to the specific target
        const { target, signal } = data;
        if (target) {
            io.to(target).emit('signal', {
                sender: socket.id,
                signal: signal
            });
        } else {
            // Broadcast to everyone else (e.g. for initial join if no specific target known yet?)
            // Usually WebRTC is P2P so we need specific targets.
            // We'll assume client logic handles targeting.
        }
    });

    // Video Synchronization
    socket.on('video:changeSource', (videoData) => {
        // Broadcast the new video source to all other clients
        socket.broadcast.emit('video:changeSource', videoData);
    });

    socket.on('video:play', (time) => {
        socket.broadcast.emit('video:play', time);
    });

    socket.on('video:pause', () => {
        socket.broadcast.emit('video:pause');
    });

    socket.on('video:seek', (time) => {
        socket.broadcast.emit('video:seek', time);
    });
});

const PORT = 3000;
const IP = getLocalIp();
const { startDiscovery } = require('./services/discovery');

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 0Xnet Server running at: http://${IP}:${PORT}`);
    console.log(`Also available at: http://localhost:${PORT}\n`);

    // Start mDNS
    startDiscovery(PORT);
});
