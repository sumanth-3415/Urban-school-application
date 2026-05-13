const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// JSON Database file paths
const dataDir = path.join(__dirname, '..', 'data');
const studentsFile = path.join(dataDir, 'students.json');
const attendanceFile = path.join(dataDir, 'attendance.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize JSON files if they don't exist
if (!fs.existsSync(studentsFile)) {
    fs.writeFileSync(studentsFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(attendanceFile)) {
    fs.writeFileSync(attendanceFile, JSON.stringify([], null, 2));
}

// Helper function to read JSON file
function readJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data || '[]');
        }
        return [];
    } catch (err) {
        console.error('Error reading JSON:', err);
        return [];
    }
}

// Helper function to write JSON file
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing JSON:', err);
        return false;
    }
}

// Helper function to save base64 image to disk
function saveBase64Image(base64Data, filename) {
    try {
        const photosDir = path.join(__dirname, '..', 'photos');
        
        // Create photos directory if it doesn't exist
        if (!fs.existsSync(photosDir)) {
            fs.mkdirSync(photosDir, { recursive: true });
        }

        // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        const base64String = base64Data.split(',')[1] || base64Data;
        const buffer = Buffer.from(base64String, 'base64');
        
        const filePath = path.join(photosDir, filename);
        fs.writeFileSync(filePath, buffer);
        
        // Return relative path for storing in DB
        return `/photos/${filename}`;
    } catch (err) {
        console.error('Error saving image:', err);
        throw err;
    }
}


// REGISTER NEW STUDENT
router.post('/register-student', async (req, res) => {
    try {
        const {
            student_name,
            student_id,
            student_class,
            face_photo
        } = req.body;

        // Validation
        if (!student_name || !student_id || !student_class || !face_photo) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Read students data
        let students = readJSON(studentsFile);

        // Check if student already exists
        const existingStudent = students.find(s => s.student_id === student_id);
        if (existingStudent) {
            return res.status(409).json({
                message: 'Student ID already registered'
            });
        }

        // Save photo to disk
        const photoFilename = `student_${student_id}_${Date.now()}.jpg`;
        const photoPath = saveBase64Image(face_photo, photoFilename);
        console.log('✅ Photo saved to:', photoPath);

        // Create new student object
        const newStudent = {
            student_id: student_id,
            student_name: student_name,
            student_class: student_class,
            face_photo: face_photo, // Keep base64 for compatibility
            face_photo_path: photoPath, // Add file path reference
            registered_date: new Date().toISOString(),
            status: 'active'
        };

        // Add to students array
        students.push(newStudent);
        writeJSON(studentsFile, students);

        res.json({
            message: 'Student registered successfully',
            student_id: student_id,
            photo_path: photoPath
        });
    } catch (err) {
        console.log('Registration Error:', err);
        res.status(500).json({
            message: 'Database Error: ' + err.message
        });
    }
});


// RECOGNIZE FACE (Face Matching)
router.post('/recognize-face', async (req, res) => {
    try {
        const { face_photo } = req.body;

        if (!face_photo) {
            return res.status(400).json({
                message: 'Face photo required'
            });
        }

        // Read students data
        let students = readJSON(studentsFile);

        if (students.length === 0) {
            return res.status(404).json({
                message: 'No registered students found'
            });
        }

        // Simple face matching - in real system use iris recognition
        // For now, return the first registered student with their face photo
        const matchedStudent = students[0];

        if (!matchedStudent) {
            return res.status(404).json({
                message: 'Face not recognized in database'
            });
        }

        res.json({
            message: 'Face recognized successfully',
            student_id: matchedStudent.student_id,
            student_name: matchedStudent.student_name,
            student_class: matchedStudent.student_class,
            registered_face_photo: matchedStudent.face_photo
        });

    } catch (err) {
        console.log('Face Recognition Error:', err);
        res.status(500).json({
            message: 'Face recognition failed'
        });
    }
});


// MARK ATTENDANCE WITH PHOTO
router.post('/mark-attendence', async (req, res) => {
    try {
        const {
            student_id,
            meal_status,
            attendance_photo,
            confidence_score
        } = req.body;

        // Validation
        if (!student_id || !meal_status || !attendance_photo) {
            return res.status(400).json({
                message: 'Student ID, photo, and meal status are required'
            });
        }

        // Read data
        let students = readJSON(studentsFile);
        let attendanceRecords = readJSON(attendanceFile);

        // Get student info
        const student = students.find(s => s.student_id === student_id);
        if (!student) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toLocaleTimeString();

        // Check if already marked today
        const todayAttendance = attendanceRecords.find(a => 
            a.student_id === student_id && a.attendance_date === date
        );

        if (todayAttendance) {
            return res.status(409).json({
                message: 'Attendance already marked today',
                already_marked: true
            });
        }

        // Save attendance photo to disk
        const photoFilename = `attendance_${student_id}_${Date.now()}.jpg`;
        const photoPath = saveBase64Image(attendance_photo, photoFilename);
        console.log('✅ Attendance photo saved to:', photoPath);

        // Create attendance record
        const newAttendanceRecord = {
            student_id: student_id,
            student_name: student.student_name,
            student_class: student.student_class,
            attendance_date: date,
            attendance_time: time,
            meal_status: meal_status,
            attendance_photo: attendance_photo, // Keep base64 for compatibility
            attendance_photo_path: photoPath, // Add file path reference
            registered_photo: student.face_photo,
            registered_photo_path: student.face_photo_path || null,
            confidence_score: confidence_score || 0,
            timestamp: now.toISOString(),
            status: 'present'
        };

        // Add to attendance array
        attendanceRecords.push(newAttendanceRecord);
        writeJSON(attendanceFile, attendanceRecords);

        res.json({
            message: 'Attendance Marked Successfully',
            student_name: student.student_name,
            student_class: student.student_class,
            photo_path: photoPath
        });
    } catch (err) {
        console.log('Mark Attendance Error:', err);
        res.status(500).json({
            message: 'Database Error: ' + err.message
        });
    }
});




// VERIFY FACE AND GET STUDENT DATA
router.post('/verify-face', async (req, res) => {
    try {
        const { student_id, attendance_photo } = req.body;

        if (!student_id || !attendance_photo) {
            return res.status(400).json({
                message: 'Student ID and photo required'
            });
        }

        // Read students data
        let students = readJSON(studentsFile);

        // Get student info
        const student = students.find(s => s.student_id === student_id);
        if (!student) {
            return res.status(404).json({
                message: 'Student not found in database'
            });
        }

        // Return student data with registered photo for comparison
        res.json({
            message: 'Student verified',
            student_id: student.student_id,
            student_name: student.student_name,
            student_class: student.student_class,
            registered_photo: student.face_photo,
            captured_photo: attendance_photo
        });

    } catch (err) {
        console.log('Face Verification Error:', err);
        res.status(500).json({
            message: 'Verification failed'
        });
    }
});

// GET ATTENDANCE BY DATE
router.get('/attendence/date/:date', async (req, res) => {
    try {
        const { date } = req.params;
        
        // Read attendance data
        let attendanceRecords = readJSON(attendanceFile);

        // Filter by date and sort by time (descending)
        const result = attendanceRecords
            .filter(a => a.attendance_date === date)
            .sort((a, b) => b.attendance_time.localeCompare(a.attendance_time));

        res.json({
            date: date,
            total_present: result.length,
            records: result
        });

    } catch (err) {
        console.log('Get Attendance by Date Error:', err);
        res.status(500).json({
            message: 'Database Error'
        });
    }
});

// GET ATTENDANCE BY STUDENT ID
router.get('/attendence/student/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;
        
        // Read attendance data
        let attendanceRecords = readJSON(attendanceFile);

        // Filter by student_id and sort by date (descending)
        const result = attendanceRecords
            .filter(a => a.student_id === student_id)
            .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date));

        res.json({
            student_id: student_id,
            total_days: result.length,
            records: result
        });

    } catch (err) {
        console.log('Get Student Attendance Error:', err);
        res.status(500).json({
            message: 'Database Error'
        });
    }
});

// GET TODAY'S ATTENDANCE
router.get('/attendence/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Read attendance data
        let attendanceRecords = readJSON(attendanceFile);

        // Filter by today's date and sort by time (descending)
        const result = attendanceRecords
            .filter(a => a.attendance_date === today)
            .sort((a, b) => b.attendance_time.localeCompare(a.attendance_time));

        res.json({
            date: today,
            total_present: result.length,
            records: result
        });

    } catch (err) {
        console.log('Get Today Attendance Error:', err);
        res.status(500).json({
            message: 'Database Error'
        });
    }
});

// GET ALL ATTENDANCE
router.get('/attendence', async (req, res) => {
    try {
        // Read attendance data
        let attendanceRecords = readJSON(attendanceFile);

        // Sort by timestamp (descending)
        const result = attendanceRecords.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        res.json(result);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Database Error'
        });
    }
});


// GET ALL STUDENTS
router.get('/students', async (req, res) => {
    try {
        // Read students data
        let students = readJSON(studentsFile);
        res.json(students);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Database Error'
        });
    }
});

// GET SINGLE STUDENT
router.get('/student/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;
        
        // Read students data
        let students = readJSON(studentsFile);

        // Find student by student_id
        const student = students.find(s => s.student_id === student_id);

        if (!student) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        res.json(student);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Database Error'
        });
    }
});

module.exports = router;