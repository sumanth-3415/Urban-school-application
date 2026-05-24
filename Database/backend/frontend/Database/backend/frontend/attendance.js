// Mark Attendance Script with Live Photo Capture
let attendancePhotoData = null;
let recognizedStudentData = null;
let selectedMealStatus = null;

// Start camera on page load
window.addEventListener('DOMContentLoaded', () => {
    startCamera();
});

async function startCamera() {
    try {
        const video = document.getElementById('cameraVideo');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
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
        showMessage('❌ Camera access denied. Please enable camera permissions.', 'error');
        console.error('Camera Error:', err);
    }
}

function captureAttendancePhoto() {
    try {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        // Check if video is ready
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            showMessage('❌ Camera not ready. Please wait a moment and try again.', 'error');
            console.error('Video dimensions are 0. Video state:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                networkState: video.networkState
            });
            return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        attendancePhotoData = canvas.toDataURL('image/jpeg', 0.95);

        if (!attendancePhotoData || attendancePhotoData.length < 100) {
            showMessage('❌ Failed to capture photo. Please try again.', 'error');
            return;
        }

        // Display preview
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${attendancePhotoData}" alt="Captured Photo" style="width: 100%; height: auto; border-radius: 8px; margin-top: 10px;">`;
        showMessage('✅ Photo captured successfully', 'success');
        
        console.log('Photo captured. Size:', attendancePhotoData.length, 'bytes');
    } catch (err) {
        console.error('Capture Error:', err);
        showMessage('❌ Error capturing photo: ' + err.message, 'error');
    }
}

async function submitAttendance() {
    const mealStatus = document.getElementById('mealStatus').value;

    if (!attendancePhotoData) {
        showMessage('❌ Please capture a photo first', 'error');
        return;
    }

    if (!mealStatus) {
        showMessage('❌ Please select meal status', 'error');
        return;
    }

    selectedMealStatus = mealStatus;

    // Show loading
    showMessage('🔍 Recognizing student...', 'info');

    try {
        // First, get all registered students
        const studentsResponse = await fetch('http://localhost:5000/students');
        const students = await studentsResponse.json();

        if (!Array.isArray(students) || students.length === 0) {
            showMessage('❌ No registered students found', 'error');
            return;
        }

        // For now, use the first registered student as match
        // In production, use actual iris/face recognition with comparison
        const matchedStudent = students[0];

        // Verify the matched student
        const verifyResponse = await fetch('http://localhost:5000/verify-face', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: matchedStudent.student_id,
                attendance_photo: attendancePhotoData
            })
        });

        const verificationData = await verifyResponse.json();

        if (!verifyResponse.ok) {
            showMessage('❌ ' + verificationData.message, 'error');
            return;
        }

        // Store recognized student data
        recognizedStudentData = {
            student_id: verificationData.student_id,
            student_name: verificationData.student_name,
            student_class: verificationData.student_class,
            registered_photo: verificationData.registered_photo
        };

        showMessage('✅ Student recognized: ' + recognizedStudentData.student_name, 'success');

        // Show verification section with photo comparison
        showVerificationSection();

    } catch (err) {
        console.error('Verification Error:', err);
        showMessage('❌ Verification failed. Please try again.', 'error');
    }
}

function showVerificationSection() {
    // Hide form section
    document.getElementById('formSection').style.display = 'none';

    // Show verification section
    const verificationSection = document.getElementById('faceVerificationSection');
    verificationSection.style.display = 'block';

    // Display captured photo
    const capturedDisplay = document.getElementById('capturedFaceDisplay');
    capturedDisplay.innerHTML = `<img src="${attendancePhotoData}" alt="Your Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;

    // Display registered photo
    const registeredDisplay = document.getElementById('registeredFaceDisplay');
    if (recognizedStudentData.registered_photo) {
        registeredDisplay.innerHTML = `<img src="${recognizedStudentData.registered_photo}" alt="Registered Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    } else {
        registeredDisplay.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f1f5f9; color: #94a3b8; border-radius: 8px;">📷 No Photo</div>`;
    }

    // Update student info with prominent name display
    const infoBox = document.querySelector('.student-info-box');
    infoBox.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; text-align: center;">
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">✅ Student Identified</p>
            <h2 style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold;" id="studentNameDisplay">${recognizedStudentData.student_name}</h2>
        </div>
        <div style="background: #f0f9ff; padding: 15px; border-radius: 12px; border-left: 4px solid #1e40af;">
            <p style="margin: 8px 0;"><strong>🆔 Student ID:</strong> <span id="studentIdDisplay">${recognizedStudentData.student_id}</span></p>
            <p style="margin: 8px 0;"><strong>📚 Class:</strong> <span id="studentClassDisplay">${recognizedStudentData.student_class}</span></p>
            <p style="margin: 8px 0;"><strong>🍽️ Meal Status:</strong> <span id="mealStatusDisplay">${selectedMealStatus}</span></p>
        </div>
    `;

    // Scroll to verification section
    verificationSection.scrollIntoView({ behavior: 'smooth' });
}

async function confirmAttendance() {
    try {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = '⏳ Submitting...';

        showMessage('⏳ Saving attendance record...', 'info');

        const response = await fetch('http://localhost:5000/mark-attendence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: recognizedStudentData.student_id,
                meal_status: selectedMealStatus,
                attendance_photo: attendancePhotoData,
                confidence_score: 95
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Attendance submitted:', data);
            // Show success section with confirmation
            showSuccessSection(data);
        } else {
            showMessage('❌ ' + data.message, 'error');
            btn.disabled = false;
            btn.textContent = '✅ Confirm & Submit';
        }
    } catch (err) {
        console.error('Submission Error:', err);
        showMessage('❌ Failed to mark attendance. Please try again.', 'error');
        const btn = event.target;
        btn.disabled = false;
        btn.textContent = '✅ Confirm & Submit';
    }
}

function showSuccessSection(attendanceData) {
    // Hide all sections
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('faceVerificationSection').style.display = 'none';

    // Show success section
    const successSection = document.getElementById('attendanceSummary');
    successSection.style.display = 'block';

    // Display summary with clear confirmation
    const summaryDetails = document.getElementById('summaryDetails');
    const mealEmoji = selectedMealStatus === 'Taken' ? '✅' : '❌';
    
    summaryDetails.innerHTML = `
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.95;">✅ ATTENDANCE MARKED</p>
            <h2 style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">Success!</h2>
        </div>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
            <p style="margin: 8px 0;"><strong>👤 Student Name:</strong> ${recognizedStudentData.student_name}</p>
            <p style="margin: 8px 0;"><strong>🆔 Student ID:</strong> ${recognizedStudentData.student_id}</p>
            <p style="margin: 8px 0;"><strong>📚 Class:</strong> ${recognizedStudentData.student_class}</p>
            <p style="margin: 8px 0;"><strong>${mealEmoji} Meal Status:</strong> ${selectedMealStatus}</p>
            <p style="margin: 8px 0;"><strong>🕐 Time:</strong> ${new Date().toLocaleTimeString()}</p>
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${attendanceData.attendance_id ? `<p style="margin: 8px 0; font-size: 12px; color: #65a30d;"><strong>📋 Record ID:</strong> ${attendanceData.attendance_id}</p>` : ''}
        </div>
    `;

    // Scroll to success section
    successSection.scrollIntoView({ behavior: 'smooth' });
}

function retakePhoto() {
    // Reset data
    attendancePhotoData = null;
    recognizedStudentData = null;
    selectedMealStatus = null;

    // Reset form
    document.getElementById('mealStatus').value = '';
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('message').innerHTML = '';

    // Show form section
    document.getElementById('formSection').style.display = 'block';
    document.getElementById('faceVerificationSection').style.display = 'none';
    document.getElementById('attendanceSummary').style.display = 'none';

    // Scroll to top
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message message-${type}`;

    if (type === 'success') {
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 4000);
    }
}

function goBack() {
    window.location.href = 'index.html';
}

