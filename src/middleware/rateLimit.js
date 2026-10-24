const { rateLimit } = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: 'Draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'},
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitos cadastros a partir deste IP. Tente novamente mais tarde'},
});

module.exports = { loginLimiter, registerLimiter };