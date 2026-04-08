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

const ALLOWED_NOTE_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.docm',
  '.dot',
  '.dotx',
  '.rtf',
  '.odt',
]);

const ALLOWED_NOTE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-word.document.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'application/vnd.ms-word.template.macroEnabled.12',
  'application/rtf',
  'text/rtf',
  'application/vnd.oasis.opendocument.text',
]);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + (ext || '.pdf'));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isAllowedMime = ALLOWED_NOTE_MIME_TYPES.has(String(file.mimetype || '').toLowerCase());
    const isAllowedExt = ALLOWED_NOTE_EXTENSIONS.has(ext);

    if (isAllowedMime || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word files are allowed'));
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
