import Jwt from 'jsonwebtoken';
import ErrorHandler from '../utils/errorHandler.js';
import UserModel from '../models/userModel.js';

export async function auth(req, res, next) {
  let token = req.header('Authorization');
  console.log(token);
  // Remove 'Bearer ' prefix if present
  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    return next(new ErrorHandler('Invalid token format', 401,'TOKEN_UNAUTHORIZED'));
  }

  if (!token) {
    return next(new ErrorHandler('No token provided', 401, 'NO_TOKEN'));
  }

  try {
    // Verify the token
    const decodedToken = Jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID
    const user = await UserModel.findById(decodedToken._id);

    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    // Check if the token is expired (based on user's token.expiresAt field)
    if (
      user.token &&
      user.token.expiresAt &&
      user.token.expiresAt < new Date()
    ) {
      // Token expired -> remove from user and save
      user.token = undefined;
      await user.save();

       return next(new ErrorHandler('Token expired. Please login again.', 401, 'TOKEN_EXPIRED'));
    }

    // Check if the token matches the user’s stored token
    if (!user.token || user.token.value !== token) {
      return next(new ErrorHandler('Token is invalid or not found.', 401, 'INVALID_TOKEN'));
    }

    // All good! Attach user to req
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
     return next(new ErrorHandler('Invalid token', 401, 'INVALID_JWT'));
  }
}

// Middleware to check if the user is an admin
export async function isAdmin(req, res, next) {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId).select('+password');

    if (!user) {
      return next(new ErrorHandler('Invalid token. User not found.', 401));
    }

    if (user.role !== 'admin') {
      return next(new ErrorHandler('Restricted.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler('Unauthorized.', 401));
  }
}


export function roleCheck(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ErrorHandler('Access denied: insufficient permissions.', 403));
    }
    next();
  };
}