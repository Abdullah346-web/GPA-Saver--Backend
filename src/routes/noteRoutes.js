const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getAllNotes,
  getAdminNotes,
  getUserNotes,
  uploadNote,
  deleteNote,
  getNoteStats,
} = require('../controllers/noteController');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Public routes
router.get('/all', getAllNotes);
router.get('/stats', getNoteStats);

// Admin routes
router.get('/admin/all', authenticate, adminOnly, getAdminNotes);

// Protected routes
router.get('/my-notes', authenticate, getUserNotes);
router.post('/upload', authenticate, upload.single('pdfFile'), uploadNote);
router.delete('/:noteId', authenticate, deleteNote);

module.exports = router;
