const form = document.getElementById('register-form');
const message = document.getElementById('message');
const button = form.querySelector('button');

function showMessage(text, type) {
    message.textContent = text;
    message.className = 'message' + type;
}

form.addEventListener('submit', async function (event){
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    if (data.password.length < 8) {
        showMessage('A senha deve ter ao menos 8 caracteres.', 'error');
        return;
    }
    if (data.password !== data.confirm) {
        showMessage('As senhas não coincidem.', 'error');
        return;
    }

    button.disabled = true;

    try{
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                password: data.password,
            }),
        });
        const result = await response.json();

        if (!response.ok) {
            showMessage(result.error || 'Erro ao criar a conta.', 'error');
            return;
        }

        showMessage('Conta criada! Redirecionando para o login...', 'success');
        setTimeout(function () {
            window.location.href = '/login.html';
        }, 1500);
    } catch (err) {
        showMessage('Não foi possível conectar ao servidor.', 'error');
    } finally {
        button.disabled = false;
    }
});