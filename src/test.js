const { createUser, findUserByEmail } = require('./users');

async function main() {
    const email = 'joao' + Date.now() + '@email.com';
    const user = await createUser('João Silva', email, 'hash_fake_por_enquanto');
    console.log('Usuário criado:', user);

    const found = await findUserByEmail('joao@email.com');
    console.log('Usuário encontrado:', found);
}

main();