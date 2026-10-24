const profileForm = document.getElementById('profile-form');
const passwordForm = document.getElementById('password-form');
const profileMessage = document.getElementById('profile-message');
const passwordMessage = document.getElementById('password-message');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');

function goToLogin() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = 'message' + type;
}

async function api(path, options) {
    const token = localStorage.getItem('token');
    if(!token) {
        goToLogin();
        return null;
    }

    const response = await fetch(path, {
        method: (options && options.method) || 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
        },
        body: options && options.body,
    });

    if (response.status === 401) {
        goToLogin()
        return null;
    }
    return response;
}

async function loadProfile() {
    try {
        const response = await api('/me');
        if (!response) return;

        const user = await response.json();
        nameInput.value = user.name;
        emailInput.value = user.email;
        document.getElementById('user-created').textContent =
            new Date(user.createdAt).ToLocaleDateString('pt-BR');
    } catch (err) {
        showMessage(profileMessage, 'Não foi possível carregar os dados.', 'error');
    }
}

profileForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const button = profileForm.querySelector('button');
    const data = Object.fromEntries(new FormData(profileForm));

    button.disabled = true;

    try {
        const response = await api('/me', {
            method: 'PUT',
            body: JSON.stringify({ name: data.name, email: data.email }),
        });
        if (!response) return;

        const result = await response.json();

        if (!response.ok) {
            showMessage(profileMessage, result.error || 'Erro ao salvar.', 'error');
            return;
        }

        nameInput.value = result.name;
        emailInput.value = result.email;
        showMessage(profileMessage, 'Dados atualizados', 'success');
    } catch (err) {
        console.error(err);
        showMessage(profileMessage, 'Não foi possível conectar ao servidor.', 'error');
    } finally {
        button.disabled = false;
    }
});

passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const button = passwordForm.querySelector('button');
    const data = Object.fromEntries(new FormData(passwordForm));

    if (data.newPassword.length < 8) {
        showMessage(passwordMessage, 'A nova senha deve ter ao menos 8 caracteres.', 'error');
        return;
    }
    if (data.newPassword !== data.confirm) {
        showMessage(passwordMessage, 'As senhas não coincidem.', 'error');
        return;
    }

    button.disabled = true;

    try {
        const response = await api('/me/password', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            }),
        });
        if(!response) return;

        const result = await response.json();

        if(!response.ok) {
            showMessage(passwordMessage, result.error || 'Erro ao alterar a senha.', 'error');
            return;
        }

        passwordForm.reset();
        showMessage(passwordMessage, result.message, 'success');
    } catch(err) {
        console.error(err);
        showMessage(passwordMessage, 'Não foi possível conectar ao servidor.', 'error');
    } finally {
        button.disabled = false;
    }
});

document.getElementById('logout').addEventListener('click', goToLogin);

loadProfile();