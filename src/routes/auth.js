const express = require('express');
const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken')
const { createUser, findUserByEmail, findUserById, updateUser } = require('../users');
const requireAuth = require('../middleware/auth');
const { loginLimiter, registerLimiter, passwordLimiter} = require('../middleware/rateLimit')

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

router.put('/me', requireAuth, async (req, res) => {
    const {name, email } = req.body;

    if (typeof name !== 'string' || typeof email !== 'string' || !name.trim() || !email.trim()) {   
        return res.status(400).json({ error: 'Nome e email são obrigatórios.'});
    }
    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ error: 'Email inválido.'});
    }
    
    try {
        const user = await updateUser(req.userId, {
            name: name.trim(),
            email: email.trim().toLowerCase(),
        });

        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    } catch (err) {
        if (err.message === 'EMAIL_ALREADY_EXISTS') {
            return res.status(409).json({ error: 'Este email ja está em uso.'});
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Usuário não encontrado.'});
        }
        console.error(err);
        return res.status(500).json({ error: 'Erro interno no servidor.'});
    }
});

router.put('/me/password', requireAuth, passwordLimiter, async (req, res) => {
    const {currentPassword, newPassword } = req.body;

    if (
        typeof currentPassword !== 'string' ||
        typeof newPassword !== 'string' ||
        !currentPassword ||
        !newPassword
    ) {
        return res.status(400).json({ error: 'Senha atual e nova são obrigatórias.'})
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'A nova senha deve ter ao menos 8 caracteres.'})
    }
    if (newPassword === currentPassword) {
        return res.status(400).json({ error: 'A nova senha deve ser diferente da atual.'})
    }

    try {
        const user = await findUserById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.'});
        }

        const matches = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!matches) {
            return res.status(403).json({ erro: 'Senha atual incorreta.'})
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await updateUser(req.userId, { passwordHash });

        return res.json({ message: 'Senha alterada com sucesso.'});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro interno do servidor.'});
    }
});

module.exports = router;