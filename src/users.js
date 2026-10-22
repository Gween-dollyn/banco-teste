const prisma = require('./db');

async function createUser(name, email, passwordHash) {
    try {
        return await prisma.user.create({
            data: {name, email, passwordHash },
        });
    } catch (err) {
        if (err.code === 'P2002') {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }
        throw err;
    }
}

async function findUserByEmail(email) {
    return await prisma.user.findUnique({
        where: { email },
    });
}

async function findUserById(id) {
    return await prisma.user.findUnique({
        where: {id},
    });
}
module.exports = { createUser, findUserByEmail, findUserById };