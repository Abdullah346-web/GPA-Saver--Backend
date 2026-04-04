const Note = require('../models/Note');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Get all public notes
const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({ isPublic: true })
      .populate('uploadedBy', 'username name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get all notes for admin
const getAdminNotes = async (req, res) => {
  try {
    const notes = await Note.find({})
      .populate('uploadedBy', 'username name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get user's notes
const getUserNotes = async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Upload note (from images converted to PDF)
const uploadNote = async (req, res) => {
  try {
    const { title, subject, description, pageCount } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
      });
    }

    // Get logged in user from token
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create note record
    const note = new Note({
      title: title || 'Untitled Note',
      subject,
      description,
      pdfFileName: req.file.filename,
      pdfUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.userId,
      uploadedByUsername: user.username,
      uploadedByName: user.name,
      fileSize: req.file.size || 0,
      pageCount: Number(pageCount) || 1,
      isPublic: true,
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully',
      note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Delete note
const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { reason } = req.body;

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check if user owns the note or is admin
    if (note.uploadedBy.toString() !== req.userId.toString() && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this note',
      });
    }

    // If admin is deleting, reason is required
    if (req.userRole === 'admin' && note.uploadedBy.toString() !== req.userId.toString()) {
      if (!reason || String(reason).trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a reason for deleting this note',
        });
      }
    }

    // Delete file from server
    const filePath = path.join(__dirname, '../../uploads', note.pdfFileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const noteTitle = note.title || 'Untitled Note';
    const uploadedById = note.uploadedBy.toString();

    // Delete note from database
    await Note.findByIdAndDelete(noteId);

    // If admin deleted user's note, create notification
    if (req.userRole === 'admin' && uploadedById !== req.userId.toString()) {
      await Notification.create({
        userId: uploadedById,
        type: 'note_deleted',
        title: 'Note Deleted by Admin',
        message: `Your note "${noteTitle}" has been deleted by admin.`,
        reason: String(reason || '').trim() || null,
        relatedNote: noteId,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get note statistics
const getNoteStats = async (req, res) => {
  try {
    const totalNotes = await Note.countDocuments({ isPublic: true });
    const recentNotes = await Note.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalNotes,
        recentNotes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getAllNotes,
  getAdminNotes,
  getUserNotes,
  uploadNote,
  deleteNote,
  getNoteStats,
};
