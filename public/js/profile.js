function goToLogin() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

async function loadProfile() {
    const token = localStorage.getItem('token');

    if (!token) {
        goToLogin();
        return;
    }


    try {
        const response = await fetch('/me', {
            headers : { Authorization: 'Bearer ' + token},
        });

        if (response.status === 401) {
            goToLogin();
            return;
        }

        const user = await response.json();

        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-created').textContent = 
            new Date(user.createdAt).toLocaleDateString('pt-BR');
    } catch (err) {
        document.getElementById('user-name').textContent =
            'Não foi possível carregar os dados.';
    }

}

document.getElementById('logout').addEventListener('click', goToLogin);

loadProfile();