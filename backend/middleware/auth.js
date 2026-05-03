const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_vida_equilibrio';

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'administrador') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Permissão de administrador requerida.' });
  }
};

// Middleware to check if user is admin, reception or nurse
const isReceptionOrAdmin = (req, res, next) => {
  const allowed = ['administrador', 'recepcao', 'enfermeira'];
  if (req.user && allowed.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
  }
};

module.exports = { authenticateToken, isAdmin, isReceptionOrAdmin, JWT_SECRET };
