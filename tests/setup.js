require('dotenv').config({ path: '.env.test', quiet: true });

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
    throw new Error(
    'DATABASE_URL de teste não encontrada. Crie o .env.test apontando para um banco com "test" no nome.'
    );
}