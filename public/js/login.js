const form = document.getElementById('login-form');
const message = document.getElementById('message');
const button = form.querySelector('button');

function showMessage(text, type) {
    message.textContent = text;
    message.className = 'message' + type;
}

form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    button.disabled = true;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email, password: data.password }),
        });
        const result = await response.json()

        if (!response.ok) {
            showMessage(result.error || 'Erro ao entrar.', 'error');
            return;
        }

        localStorage.setItem('token', result.token);
        window.location.href = '/profile.html'
    } catch (err) {
        showMessage('Não foi possível conectar ao servidor.', 'error');
    } finally {
        button.disabled = false;
    }
});