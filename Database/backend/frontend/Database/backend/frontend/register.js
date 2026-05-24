// Register Student Script
let photoData = null;

// Start camera on page load
window.addEventListener('DOMContentLoaded', () => {
    startCamera();
});

async function startCamera() {
    try {
        const video = document.getElementById('cameraVideo');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = stream;
        video.play();
        
        // Wait for video to be ready
        video.onloadedmetadata = () => {
            video.play();
            console.log('✅ Camera ready. Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        };
    } catch (err) {
        console.error('Camera Error:', err);
        showMessage('⚠️ Camera not available. Using test mode - click Capture Photo to generate a test image.', 'warning');
        // Enable capture button even without camera for testing
        enableTestMode();
    }
}

function enableTestMode() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Create a test gradient image
    const gradient = ctx.createLinearGradient(0, 0, 640, 480);
    gradient.addColorStop(0, '#3498db');
    gradient.addColorStop(1, '#e74c3c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 480);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TEST MODE', 320, 200);
    ctx.font = '16px Arial';
    ctx.fillText('Click Capture Photo to register', 320, 250);
    
    // Convert to video stream
    video.style.backgroundImage = `url(${canvas.toDataURL()})`;
    video.style.backgroundColor = '#000';
}

function capturePhoto() {
    try {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        // Check if video is available
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            // Generate test photo for demonstration
            canvas.width = 640;
            canvas.height = 480;
            
            // Create a colorful test image
            const gradient = context.createLinearGradient(0, 0, 640, 480);
            gradient.addColorStop(0, '#2ecc71');
            gradient.addColorStop(0.5, '#3498db');
            gradient.addColorStop(1, '#e74c3c');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 640, 480);
            
            context.fillStyle = 'white';
            context.font = 'bold 48px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('📷', 320, 240);
            context.font = '20px Arial';
            context.fillText('Test Photo Generated', 320, 380);
            
            console.log('Generated test photo for demonstration');
        } else {
            // Use actual camera
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        photoData = canvas.toDataURL('image/jpeg', 0.95);

        if (!photoData || photoData.length < 100) {
            showMessage('❌ Failed to capture photo. Please try again.', 'error');
            return;
        }

        // Display preview
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${photoData}" alt="Captured Photo" style="width: 100%; height: auto; border-radius: 8px; margin-top: 10px;">`;
        showMessage('✅ Photo captured successfully', 'success');
        
        console.log('Photo captured. Size:', photoData.length, 'bytes');
    } catch (err) {
        console.error('Capture Error:', err);
        showMessage('❌ Error capturing photo: ' + err.message, 'error');
    }
}

async function registerStudent() {
    const studentName = document.getElementById('studentName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const studentClass = document.getElementById('studentClass').value.trim();

    // Validation
    if (!studentName || !studentId || !studentClass) {
        showMessage('❌ Please fill all required fields', 'error');
        return;
    }

    if (!photoData) {
        showMessage('❌ Please capture a face photo', 'error');
        return;
    }

    try {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = '⏳ Registering...';

        const response = await fetch('http://localhost:5000/register-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_name: studentName,
                student_id: studentId,
                student_class: studentClass,
                face_photo: photoData
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('✅ ' + data.message, 'success');
            setTimeout(() => {
                alert('Student registered successfully! Redirecting...');
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage('❌ ' + data.message, 'error');
            btn.disabled = false;
            btn.textContent = '✅ Register Student';
        }
    } catch (err) {
        console.error('Error:', err);
        showMessage('❌ Registration failed. Try again.', 'error');
        btn.disabled = false;
        btn.textContent = '✅ Register Student';
    }
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message show ${type}`;
    setTimeout(() => {
        msg.className = 'message';
    }, 4000);
}

function goBack() {
    window.location.href = 'index.html';
}
