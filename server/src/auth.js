import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pulseflow-super-secret-key-2026';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Session expired or invalid' });
  }
}

export function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, error: 'Forbidden: No role assigned' });
    }

    // Convert to lowercase for loose matching, or just do substring matching
    const userRole = req.user.role.toLowerCase();
    
    // We allow if any of the allowedRoles matches part of the user's role
    const hasRole = allowedRoles.some(role => userRole.includes(role.toLowerCase()));
    
    if (!hasRole) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges for this action' });
    }
    
    next();
  };
}
