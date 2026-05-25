const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const attendanceRoutes = require('./routes/attendence');

const app = express();

// CORS Configuration for localhost, Vercel, and Render deployment
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5000',
            'http://127.0.0.1:3000',
            'https://urban-school-backend.onrender.com'
        ];
        
        // Allow requests from localhost, Render, and Vercel domains
        if (!origin || origin.includes('onrender.com') || 
            origin.includes('vercel.app') || 
            origin.includes('localhost') || 
            origin.includes('127.0.0.1') ||
            allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Create photos directory if it doesn't exist
const photosDir = path.join(__dirname, 'photos');
if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
    console.log('✅ Created photos directory');
}

// Serve static files from frontend folder and photos
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/photos', express.static(photosDir));

// API Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.use('/', attendanceRoutes);

// Dynamic Port Configuration - Use PORT env variable for Vercel, default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});