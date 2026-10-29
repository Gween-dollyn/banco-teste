const { rateLimit } = require('express-rate-limit');

const skipInTests = () =>
    process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT;

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    skip: skipInTests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'},
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    skip: skipInTests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitos cadastros a partir deste IP. Tente novamente mais tarde'},
});

const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    skip: skipInTests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de troca de senha. Tente novamente em 15 minutos.'},
});

module.exports = { loginLimiter, registerLimiter, passwordLimiter };