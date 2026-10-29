const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/db');

const validUser = {
    name: 'Maria',
    email: 'maria@email.com',
    password: 'senha12345',
};

function authHeader(token) {
    return 'Bearer ' +  token;
}

async function registerAndLogin(user = validUser) {
    await request(app).post('/register').send(user);
    const res = await request(app)
        .post('/login')
        .send({ email: user.email, password: user.password });
    return res.body.token;
}

beforeEach(async () => {
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('POST /register', () => {
    test('cria o usuário e não devolve a senha nem o hash.', async () => {
        const res = await request(app).post('/register').send(validUser);

        expect(res.status).toBe(201);
        expect(res.body.email).toBe('maria@email.com');
        expect(res.body.id).toBeDefined();
        expect(res.body.password).toBeUndefined();
        expect(res.body.passwordHash).toBeUndefined();
    });
    
    test('salva senha como hash bcrypt, nunca texto puro', async () => {
        await request(app).post('/register').send(validUser);

        const saved = await prisma.user.findUnique({ where: { email: validUser.email } });

        expect(saved.passwordHash).not.toBe(validUser.password);
        expect(saved.passwordHash.startsWith('$2')).toBe(true);
    });

    test('normaliza o email para minúsculas', async () => {
        const res = await request(app)
            .post('/register')
            .send({...validUser, email: 'MARIA@Email.com' });

        expect(res.status).toBe(201);
        expect(res.body.email).toBe('maria@email.com');
    });

    test('retorna 400 quando faltam campos', async () => {
        const res = await request(app).post('/register').send({ email: validUser.email });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test('retorna 400 para email inválido', async () => {
        const res = await request(app)
            .post('/register')
            .send({...validUser, email: 'isso-nao-e-email' });
        
        expect(res.status).toBe(400);
    });

    test('retorna 400 para senhas com menos de 8 caracteres', async () => {
        const res = await request(app)
            .post('/register')
            .send({...validUser, password: '1234567' });

        expect(res.status).toBe(400);
    });

    test('retorna 409 para email ja cadastrado', async () => {
        await request(app).post('/register').send(validUser);
        const res = await request(app).post('/register').send(validUser);

        expect(res.status).toBe(409);
    });
});

describe('POST /login', () => {
    beforeEach(async () => {
        await request(app).post('/register').send(validUser);
    });

    test('retorna token e dados do usuário com credenciais corretas', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: validUser.email, password: validUser.password });


        expect(res.status).toBe(200);
        expect(typeof res.body.token).toBe('string');
        expect(res.body.user.email).toBe(validUser.email)
        expect(res.body.user.passwordHash).toBeUndefined();
    });

    test('aceita o email em maiúsculas', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'MARIA@EMAIL.COM', password: validUser.password });

        expect(res.status).toBe(200);
    });

    test('retorna 401 com senha errada', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: validUser.email, password: 'senhaerrada' });

        expect(res.status).toBe(401);
        expect(res.body.token).toBeUndefined();
    });

    test('usar a mesma resposta para email inexistente e senha errada', async () => {
        const wrongPassword = await request(app)
            .post('/login')
            .send({ email: validUser.email, password: 'senhaerrada' });
        const unknownEmail = await request(app)
            .post('/login')
            .send({ email: 'naoexiste@email.com', password: 'senhaerrada' });

        expect(unknownEmail.status).toBe(401);
        expect(unknownEmail.body).toEqual(wrongPassword.body);
    });

    test('retorna 400 quando faltam campos', async () => {
        const res = await request(app).post('/login').send({ email: validUser.email });

        expect(res.status).toBe(400);
    });
});

describe('GET /me', () => {
    test('retorna 401 sem token', async () => {
        const res = await request(app).get('/me');

        expect(res.status).toBe(401);
    });

    test('retorna 401 com token malformado', async () => {
        const res = await request(app).get('/me').set('Authorization', authHeader('abc'));

        expect(res.status).toBe(401);
    });

    test('retorna 401 com token expirado', async () => {
        const expired = jwt.sign({ sub: 1}, process.env.JWT_SECRET, { expiresIn: -10 });
        const res = await request(app).get('/me').set('Authorization', authHeader(expired));

        expect(res.status).toBe(401);
    });

    test('retorna 401 com token assinado por outro segredo', async () => {
        const forged = jwt.sign({ sub: 1 }, 'outro-segredo', {expiresIn: '1h'});
        const res = await request(app).get('/me').set('Authorization', authHeader(forged));

        expect(res.status).toBe(401);
    });

    test('retorna os dados do usuário com token válido', async () => {
        const token = await registerAndLogin();
        const res = await request(app).get('/me').set('Authorization', authHeader(token));

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(validUser.email);
        expect(res.body.passwordHash).toBeUndefined();
    });
});

describe('PUT /me', () => {
    test('atualiza nome e email', async () => {
        const token = await registerAndLogin();

        const res = await request(app)
            .put('/me')
            .set('Authorization', authHeader(token))
            .send({ name: 'Maria Souza', email: 'maria.souza@email.com '});

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Maria Souza');
        expect(res.body.email).toBe('maria.souza@email.com');
    });

    test('retorna 409 se o email ja pertencer a outra conta', async () => {
        await request(app).post('/register').send(validUser);
        const token = await registerAndLogin({
            name: 'João',
            email: 'joao@email.com',
            password: 'senha12345',
        });

        const res = await request(app)
            .put('/me')
            .set('Authorization', authHeader(token))
            .send({ name: 'João', email: validUser.email });

        expect(res.status).toBe(409);
    });

    test('retorna 400 para email inválido', async () => {
        const token = await registerAndLogin();

        const res = await request(app)
            .put('/me')
            .set('Authorization', authHeader(token))
            .send({ name: 'Maria', email: 'invalido' });

        expect(res.status).toBe(400);
    });

    test('ignora campos que não podem ser editados por aqui', async () => {
        const token = await registerAndLogin();

        await request(app)
            .put('/me')
            .set('Authorization', authHeader(token))
            .send({ name: 'Maria', email: validUser.email, passwordHash: 'hackeado' });

        const login = await request(app)
            .post('/login')
            .send({ email: validUser.email, password: validUser.password });

        expect(login.status).toBe(200);
    });

    test('retorna 401 sem token', async () => {
        const res = await request(app).put('/me').send({ name: 'X', email: 'x@email.com' });

        expect(res.status).toBe(401);
    });
});

describe('PUT /me/password', () => {
    test('troca a senha>: a antiga deixa de funcionar e a nova funciona', async () => {
        const token = await registerAndLogin();

        const change = await request(app)
            .put('/me/password')
            .set('Authorization', authHeader(token))
            .send({ currentPassword: validUser.password, newPassword: 'novasenha123' });

        expect(change.status).toBe(200);

        const oldLogin = await request(app)
            .post('/login')
            .send({ email: validUser.email, password: validUser.password });
        const newLogin = await request(app)
            .post('/login')
            .send({ email: validUser.email, password: 'novasenha123' });

        expect(oldLogin.status).toBe(401);
        expect(newLogin.status).toBe(200);
    });

    test('retorna 403 (e não 401) com a senha atual errada', async () => {
        const token = await registerAndLogin();

        const res = await request(app)
            .put('/me/password')
            .set('Authorization', authHeader(token))
            .send({ currentPassword: 'senhaerrada', newPassword: 'novasenha123'});

        expect(res.status).toBe(403);
    });

    test('retorna 400 se a nova senha for muito curta', async () => {
        const token = await registerAndLogin();

        const res = await request(app)
            .put('/me/password')
            .set('Authorization', authHeader(token))
            .send({ currentPassword: validUser.password, newPassword: '123' });

        expect(res.status).toBe(400);
    });

    test('retorna 400 se a nova senha for igual a atual', async () => {
        const token = await registerAndLogin();

        const res = await request(app)
            .put('/me/password')
            .set('Authorization', authHeader(token))
            .send({ currentPassword: validUser.password, newPassword: validUser.password });

        expect(res.status).toBe(400);
    });

    test('retorna 401 sem token', async () => {
        const res = await request(app)
            .put('/me/password')
            .send({ currentPassword: 'a', newPassword: 'novasenha123' });

        expect(res.status).toBe(401);
    });
});