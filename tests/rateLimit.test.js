process.env.TEST_RATE_LIMIT = '1'

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/db');

const validUser = {
    name: 'Maria',
    email: 'maria@email.com',
    password: 'senha12345',
};

beforeAll(async () => {
    await prisma.user.deleteMany();
    await request(app).post('/register').send(validUser);
});

afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$connect();
});

describe('rate limit do /login', () => {
    test('logins corretos não contam no limite', async () => {
        for (let i = 0; i < 7;  i++) {
            const res = await request(app)
                .post('/login')
                .send({ email: validUser.email, password: validUser.password });

            expect(res.status).toBe(200);
        }
    });

    test('bloqueia com 429 depois de 5 tentativas falhas', async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post('/login')
                .send({ email: validUser.email, password: 'senhaerrada' });

            expect(res.status).toBe(401);
        }

        const blocked = await request(app)
            .post('/login')
            .send({ email: validUser.email, password: 'senhaerrada' });

        expect(blocked.status).toBe(429);
        expect(blocked.body.error).toMatch(/Muitas tentativas/);
    });
});