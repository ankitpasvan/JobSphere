import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * [TalentBridge Security Protocol]
 * Middleware to verify JWT identity nodes and grant access to privileged terminal routes.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract bearer segment from Authorization header
    token = req.headers.authorization.split(' ')[1];
  }

  // 1. Deny access if no session node is located
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: Secure identity node not located in current session.' 
    });
  }

  try {
    // 2. Cryptographically verify the token segment
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Attach verified user to the request stream
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'Security Violation: Identity node no longer exists.'
      });
    }

    next(); 
  } catch (err) {
    console.error('Auth Error:', err);
    res.status(401).json({ 
      success: false, 
      message: 'Security Violation: Corrupted authorization segment. Identity verification failed.' 
    });
  }
};

/**
 * [TalentBridge Security Protocol]
 * Middleware to grant access based on user roles (RBAC).
 * @param  {...string} roles - Permitted roles (candidate, recruiter)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Security Violation: Node role [${req.user.role}] is unauthorized for this access point.`
      });
    }
    next();
  };
};
