const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      // Check if user changed password after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please log in again.'
        });
      }

      // Grant access to protected route
      req.user = decoded;
      req.currentUser = user;
      req.token = token;
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Middleware to check if user is authenticated (optional)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token
        const user = await User.findById(decoded.userId);
        if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
          req.user = decoded;
          req.currentUser = user;
          req.token = token;
        }
      } catch (tokenError) {
        // Invalid token, but continue without authentication
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Middleware to restrict access to certain roles
const restrictTo = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.currentUser) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!roles.includes(req.currentUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};

// Middleware to check project ownership or collaboration
const checkProjectAccess = (permission = 'read') => {
  return async (req, res, next) => {
    try {
      const Project = require('../models/Project');
      const projectId = req.params.projectId || req.body.project;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has access to the project
      const hasAccess = project.hasPermission(req.user.userId, permission);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to perform this action.'
        });
      }

      req.project = project;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Project access check failed',
        error: error.message
      });
    }
  };
};

// Middleware to check if user owns the resource
const checkOwnership = (Model, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check ownership
      const isOwner = resource.createdBy ? 
        resource.createdBy.toString() === req.user.userId :
        resource.owner ? resource.owner.toString() === req.user.userId : false;

      if (!isOwner && req.currentUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ownership check failed',
        error: error.message
      });
    }
  };
};

// Middleware to validate API key (for external integrations)
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }

    // In production, you would validate against stored API keys
    // For now, we'll use a simple check
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API key validation failed',
      error: error.message
    });
  }
};

// Middleware to log user activity
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // In production, you would log this to a database or logging service
        console.log(`User ${req.user.userId} performed action: ${action} at ${new Date().toISOString()}`);
        
        // You could also update user's lastActivity timestamp
        await User.findByIdAndUpdate(req.user.userId, {
          lastActivity: new Date()
        });
      }
      next();
    } catch (error) {
      // Don't fail the request if logging fails
      next();
    }
  };
};

// Middleware to handle rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.userId;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      requests.set(userId, requests.get(userId).filter(time => time > windowStart));
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }

    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  checkProjectAccess,
  checkOwnership,
  validateApiKey,
  logActivity,
  userRateLimit
};