const User = require('../models/User');

const ONLINE_USER_TTL_MS = Math.max(
  Number(process.env.ONLINE_USER_TTL_SECONDS || 90) * 1000,
  30 * 1000
);

const markStaleUsersOffline = async () => {
  const cutoff = new Date(Date.now() - ONLINE_USER_TTL_MS);
  await User.updateMany(
    {
      role: 'user',
      isOnline: true,
      $or: [{ lastSeenAt: { $exists: false } }, { lastSeenAt: { $lt: cutoff } }],
    },
    {
      $set: {
        isOnline: false,
        currentToken: null,
      },
    }
  );
  return cutoff;
};

// Get all users (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const onlineCutoff = await markStaleUsersOffline();

    let query = { role: 'user' };
    if (search) {
      query = {
        role: 'user',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    const normalizedUsers = users.map((userDoc) => {
      const userObj = userDoc.toObject();
      const isRecentlySeen =
        Boolean(userObj.lastSeenAt) && new Date(userObj.lastSeenAt).getTime() >= onlineCutoff.getTime();

      return {
        ...userObj,
        isOnline: Boolean(userObj.isOnline) && isRecentlySeen,
      };
    });

    res.status(200).json({
      success: true,
      count: normalizedUsers.length,
      users: normalizedUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const onlineCutoff = await markStaleUsersOffline();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({
      role: 'user',
      isOnline: true,
      lastSeenAt: { $gte: onlineCutoff },
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
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

// Delete user (Admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update user password (Admin)
const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    const normalizedPassword = String(password || '');
    if (!normalizedPassword || normalizedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const targetUser = await User.findById(userId).select('+password');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin password cannot be changed from this panel',
      });
    }

    targetUser.password = normalizedPassword;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
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
  getAllUsers,
  getUserStats,
  deleteUser,
  updateUserPassword,
  getProfile,
};
