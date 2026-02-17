// backend/src/middlewares/contextMiddleware.js
const { contextStorage } = require('../utils/context');

const contextMiddleware = (req, res, next) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // req.user จะมีค่าเมื่อผ่าน Auth Middleware แล้ว
  const userId = req.user ? req.user.id : null;

  const store = {
    userId,
    ipAddress,
    userAgent,
  };

  contextStorage.run(store, () => {
    next();
  });
};

module.exports = contextMiddleware;
