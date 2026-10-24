const express = require('express');
const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken')
const { createUser, findUserByEmail, findUserById } = require('../users');
const requireAuth = require('../middleware/auth');
const { loginLimiter, registerLimiter} = require('../middleware/rateLimit')

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', registerLimiter, async (req, res) => {
    const { name, email, password } = req.body;

    //validação
    if (!name || !email || !password) {
        return res.status(400).json({error: 'Nome, email e senha são obrigatórios.'});
    }
    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Email inválido.'});
    }
    if (password.length < 8) {
        return res.status(400).json({error: 'A senha deve ter pelo menos 8 caracteres.'})
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await createUser(
            name.trim(),
            email.trim().toLowerCase(),
            passwordHash
        );

        //nunca retornar passwordHash na resposta
        return res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    } catch (err) {
        if (err.message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(409).json({error: 'Este email ja esta cadastrado.'});
        }
        console.error(err);
        return res.status(500).json({error: 'Erro interno do servidor.'});
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const user = await findUserByEmail(email.trim().toLowerCase());

        const invalid = { error: 'Email ou senha incorretos.' };7

        if (!user) {
            return res.status(401).json(invalid);
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json(invalid);
        }

        const token = jwt.sign({ sub: user.id}, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        return res.json({
            token,
            user: {id: user.id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try{
        const user = await findUserById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro interno do servidor.' })
    }
});

module.exports = router;