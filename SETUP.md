# Backend Setup Guide

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in Backend folder:
```env
MONGO_URI=mongodb://localhost:27017/gpa-saver
JWT_SECRET=your_super_secret_jwt_key_12345
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

3. Ensure MongoDB is running:
```bash
# On Mac/Linux
mongod

# On Windows, MongoDB should run as a service
```

4. Start the server:
```bash
npm start
```

Or for development (with auto-reload):
```bash
npm run dev
```

## Environment Setup

### MongoDB Local Setup
```bash
# Install MongoDB Community
# https://docs.mongodb.com/manual/installation/

# Start MongoDB service
mongod

# Verify connection
mongosh  # MongoDB shell
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update MONGO_URI in `.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gpa-saver
```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth Routes
```
POST /auth/login
  Body: { email, password }
  Returns: { token, user }

POST /auth/register
  Body: { name, username, password, email }
  Returns: { user }
```

### User Routes (Protected - requires JWT)
```
GET /users/profile
  Headers: { Authorization: Bearer <token> }

GET /users/all?search=<query>
  Headers: { Authorization: Bearer <token> }
  Admin only

GET /users/stats
  Headers: { Authorization: Bearer <token> }
  Admin only

DELETE /users/:userId
  Headers: { Authorization: Bearer <token> }
  Admin only
```

### Notes Routes
```
GET /notes/all
  Public - Get all notes

GET /notes/stats
  Public - Get statistics

GET /notes/my-notes
  Protected - Get user's notes

POST /notes/upload
  Protected - Upload new note
  Body: { title, description, pdfFileName, fileSize, pageCount }

DELETE /notes/:noteId
  Protected - Delete user's note
```

## Auto-Seeded Admin User

On first server start, admin user is automatically created:
- **Email:** admin123@gmail.com
- **Username:** admin
- **Password:** abdullah12345
- **Role:** admin

## Database Models

### User Schema
```javascript
{
  name: String,
  username: String (unique),
  email: String (unique, sparse),
  password: String (hashed),
  role: 'admin' | 'user',
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Note Schema
```javascript
{
  title: String,
  description: String,
  pdfUrl: String,
  pdfFileName: String,
  uploadedBy: ObjectId (User),
  uploadedByUsername: String,
  fileSize: Number,
  pageCount: Number,
  views: Number,
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Middleware

### Authentication Middleware
- Verifies JWT token from request header
- Extracts userId and role
- Passes to next middleware

### Admin Only Middleware
- Checks if user role is 'admin'
- Returns 403 if not admin

## File Upload

- Maximum file size: 50MB
- Allowed format: PDF only
- Storage location: `/uploads/`
- Public access: `/uploads/filename.pdf`

## Error Handling

All endpoints return JSON responses with structure:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {},
  "error": "Error details"
}
```

## Debugging

### Check Server Status
```bash
curl http://localhost:5000/api/health
```

### MongoDB Connection
```bash
# In .env, ensure MONGO_URI is correct
# Check MongoDB is running
# View connection logs in terminal
```

### JWT Issues
- Ensure JWT_SECRET is set in .env
- Check token expiry in .env (JWT_EXPIRE)
- Verify Authorization header format: `Bearer <token>`

## Performance Tips

1. Add MongoDB indexes for faster queries
2. Implement pagination for large datasets
3. Cache frequently accessed data
4. Use compression middleware
5. Monitor database performance

## Security Checklist

- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens for authentication
- ✅ CORS enabled for frontend
- ✅ Environment variables for secrets
- ✅ Input validation on routes
- ✅ File upload size limits
- ✅ Role-based access control

## Common Issues

### "ECONNREFUSED" MongoDB Error
- MongoDB not running
- Wrong MONGO_URI in .env
- Network connectivity issue

### "Port already in use"
```bash
# Kill process on port 5000
# Linux/Mac: lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Windows: netstat -ano | findstr :5000
```

### "Module not found"
- Run `npm install`
- Clear node_modules and reinstall

## Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use environment-specific `.env`
3. Set strong JWT_SECRET
4. Use MongoDB Atlas or managed database
5. Enable HTTPS
6. Set proper CORS origins
7. Use process manager (PM2, Forever)

---

**Backend is ready! Connect with Frontend at http://localhost:3000**
