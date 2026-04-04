const mongoose = require('mongoose');

// Note (Shared Notes) Schema
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'Untitled Note',
    },
    subject: {
      type: String,
      trim: true,
      required: [true, 'Subject is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String,
      required: [true, 'PDF URL is required'],
    },
    pdfFileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedByUsername: {
      type: String,
      required: true,
    },
    uploadedByName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
noteSchema.index({ uploadedBy: 1, createdAt: -1 });
noteSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
