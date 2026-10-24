require('dotenv').config();
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET não definido no .env');
    process.exit(1);
}

const path = require('path');
const express = require('express');
const authRoutes = require('./routes/auth');

const app= express();

app.use(express.json()); //ler o corpo das requisições JSON
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
    res.json({status: 'ok' });
});

app.use('/', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Servidor rodando em http://localhost' + PORT);
});
