require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const noteRoutes = require('./routes/noteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads folder)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gpa-saver';

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Seed admin user if doesn't exist
    seedAdminUser();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️ Running in degraded mode: only fallback admin login is available');
  });

// Seed admin user function
async function seedAdminUser() {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin123@gmail.com' });

    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin',
        username: 'admin',
        email: 'admin123@gmail.com',
        password: 'abdullah12345',
        role: 'admin',
      });

      await adminUser.save();
      console.log('✅ Admin user seeded successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API available at http://localhost:${PORT}`);
});
