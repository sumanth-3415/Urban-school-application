const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const attendanceRoutes = require('./routes/attendence');

const app = express();

app.use(cors());
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

app.listen(5000, () => {
    console.log('Server Running on Port 5000');
});