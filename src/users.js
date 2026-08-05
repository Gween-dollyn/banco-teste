const prisma = require('./db');

async function createUser(name, email, passwordHash) {
    return await prisma.user.create({
        data: { name, email, passwordHash },
    });
}

async function findUserByEmail(email) {
    return await prisma.user.findUnique({
        where: { email },
    });
}

module.exports = { createUser, findUserByEmail };