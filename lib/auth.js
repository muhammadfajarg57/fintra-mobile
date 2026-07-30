import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'finmo_super_secret_jwt_key_2026';

export function getAuthUser(req) {
  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (e) {
    return null;
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}
