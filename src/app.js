const path = require('path');
const express = require('express');
const authRoutes = require('./routes/auth');

const app= express();

app.set('trust proxy', 1)

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
    res.json({status: 'ok' });
});

app.use('/', authRoutes);

module.exports = app;

