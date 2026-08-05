const { createUser, findUserByEmail } = require('./users');

async function main() {
    const user = await createUser('João Silva', 'joao@email.com', 'hash_fake_por_enquanto');
    console.log('Usuário criado:', user);

    const found = await findUserByEmail('joao@email.com');
    console.log('Usuário encontrado:', found);
}

main();