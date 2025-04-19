import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    console.log('Auth header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'undefined');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('No token found after Bearer prefix');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    try {
      // Log the token secret being used
      console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
      console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
      
      // Verify token and extract payload
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified, payload:', JSON.stringify(verified, null, 2));
      
      // Ensure userId exists in the token payload
      if (!verified || !verified.userId) {
        console.error('Invalid token structure - missing userId');
        return res.status(401).json({ 
          message: 'Invalid token structure', 
          details: 'Token does not contain required userId field'
        });
      }
      
      // Add user from payload
      req.user = verified;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return res.status(401).json({ 
        message: 'Token verification failed', 
        details: jwtError.message 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - insufficient role' });
    }

    next();
  };
};