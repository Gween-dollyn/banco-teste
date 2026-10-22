const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type != 'Bearer' || !token) {
        return res.status(401).json({error: 'Token não informado.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = Number(payload.sub);
        next();
    } catch (err) {
        console.error('Erro JWT:', err.message);
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

module.exports = requireAuth;