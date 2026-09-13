// Переменные состояния
let adminLoggedIn = false;
let currentEditId = null;

// Навигация между экранами
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showMain() {
    showScreen('mainScreen');
    clearMessages();
}

function showRegistration() {
    showScreen('registrationScreen');
    document.getElementById('registrationForm').reset();
    clearMessages();
}

function showAdminLogin() {
    showScreen('adminLoginScreen');
    document.getElementById('adminLoginForm').reset();
    clearMessages();
}

function showAdmin() {
    if (!adminLoggedIn) {
        showAdminLogin();
        return;
    }
    showScreen('adminScreen');
    loadResidents();
}

function showEditScreen(id) {
    currentEditId = id;
    fetch(`/api/residents/${id}`)
        .then(res => res.json())
        .then(resident => {
            document.getElementById('editId').value = resident.id;
            document.getElementById('editFirstName').value = resident.firstName;
            document.getElementById('editLastName').value = resident.lastName;
            document.getElementById('editMiddleName').value = resident.middleName || '';
            document.getElementById('editAge').value = resident.age;
            document.getElementById('editWorkplace').value = resident.workplace;
            showScreen('editScreen');
        })
        .catch(error => {
            showMessage('editMessage', 'Ошибка при загрузке данных', 'error');
        });
}

// Обработка регистрации
async function handleRegistration(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const middleName = document.getElementById('middleName').value.trim();
    const age = parseInt(document.getElementById('age').value);
    const workplace = document.getElementById('workplace').value;

    if (!firstName || !lastName || !age || !workplace) {
        showMessage('registrationMessage', 'Заполните все обязательные поля', 'error');
        return;
    }

    try {
        const response = await fetch('/api/residents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                middleName,
                age,
                workplace
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('registrationMessage', '✓ ' + data.message, 'success');
            document.getElementById('registrationForm').reset();
            setTimeout(() => showMain(), 2000);
        } else {
            showMessage('registrationMessage', data.error || 'Ошибка при регистрации', 'error');
        }
    } catch (error) {
        showMessage('registrationMessage', 'Ошибка сервера', 'error');
    }
}

// Обработка входа админа
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok) {
            adminLoggedIn = true;
            showAdmin();
        } else {
            showMessage('loginMessage', data.error || 'Неверный пароль', 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Ошибка сервера', 'error');
    }
}

// Загрузка списка жителей
async function loadResidents() {
    try {
        const response = await fetch('/api/residents');
        const residents = await response.json();

        const tbody = document.getElementById('residentsTableBody');
        tbody.innerHTML = '';

        if (residents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Нет зарегистрированных жителей</td></tr>';
            return;
        }

        residents.forEach(resident => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${resident.id}</td>
                <td>${resident.firstName}</td>
                <td>${resident.lastName}</td>
                <td>${resident.middleName || '-'}</td>
                <td>${resident.age}</td>
                <td>${resident.workplace}</td>
                <td>
                    <button class="action-btn edit" onclick="showEditScreen(${resident.id})">Изменить</button>
                    <button class="action-btn delete" onclick="deleteResident(${resident.id})">Удалить</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка при загрузке жителей:', error);
    }
}

// Редактирование жителя
async function handleEdit(event) {
    event.preventDefault();
    
    const id = document.getElementById('editId').value;
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const middleName = document.getElementById('editMiddleName').value.trim();
    const age = parseInt(document.getElementById('editAge').value);
    const workplace = document.getElementById('editWorkplace').value.trim();

    if (!firstName || !lastName || !age || !workplace) {
        showMessage('editMessage', 'Заполните все обязательные поля', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/residents/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                middleName,
                age,
                workplace
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('editMessage', '✓ ' + data.message, 'success');
            setTimeout(() => showAdmin(), 1500);
        } else {
            showMessage('editMessage', data.error || 'Ошибка при обновлении', 'error');
        }
    } catch (error) {
        showMessage('editMessage', 'Ошибка сервера', 'error');
    }
}

// Удаление жителя
async function deleteResident(id) {
    if (!confirm('Вы уверены, что хотите удалить этого жителя?')) {
        return;
    }

    try {
        const response = await fetch(`/api/residents/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            loadResidents();
        } else {
            alert(data.error || 'Ошибка при удалении');
        }
    } catch (error) {
        alert('Ошибка сервера');
    }
}

// Выход админа
function logoutAdmin() {
    adminLoggedIn = false;
    showMain();
}

// Утилиты
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
}

function clearMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => msg.textContent = '');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    showMain();
});