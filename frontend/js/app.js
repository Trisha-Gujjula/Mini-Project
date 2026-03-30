// ===== Prashikshan App Utilities =====

const API_BASE = '/api';

// ===== Auth Token Management =====
function getToken() {
    return localStorage.getItem('prashikshan_token');
}

function setToken(token) {
    localStorage.setItem('prashikshan_token', token);
}

function removeToken() {
    localStorage.removeItem('prashikshan_token');
    localStorage.removeItem('prashikshan_user');
}

function getUser() {
    const user = localStorage.getItem('prashikshan_user');
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    localStorage.setItem('prashikshan_user', JSON.stringify(user));
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    removeToken();
    window.location.href = '/login.html';
}

// ===== API Client =====
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                removeToken();
                window.location.href = '/login.html';
                return null;
            }
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

async function apiGet(endpoint) {
    return apiRequest(endpoint, { method: 'GET' });
}

async function apiPost(endpoint, body) {
    return apiRequest(endpoint, { method: 'POST', body });
}

async function apiPut(endpoint, body) {
    return apiRequest(endpoint, { method: 'PUT', body });
}

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
    };

    const toast = document.createElement('div');
    toast.className = `toast-custom ${type}`;
    toast.innerHTML = `
        <i class="${icons[type] || icons.success}" style="color: var(--${type === 'error' ? 'danger' : type})"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Loading =====
function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner-custom"></div>';
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

// ===== Auth Guard =====
function requireAuth(allowedRoles = []) {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }

    const user = getUser();
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        window.location.href = `/${user.role}/dashboard.html`;
        return false;
    }

    return true;
}

// ===== Navbar =====
function renderNavbar(activePage = '') {
    const user = getUser();
    const isAuth = isLoggedIn();

    let navLinks = '';
    if (!isAuth) {
        navLinks = `
            <li class="nav-item"><a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="/">Home</a></li>
            <li class="nav-item"><a class="nav-link ${activePage === 'login' ? 'active' : ''}" href="/login.html">Login</a></li>
            <li class="nav-item"><a class="nav-link" href="/register.html"><button class="btn-primary-custom btn-sm-custom">Register</button></a></li>
        `;
    } else {
        const dashLink = `/${user.role}/dashboard.html`;
        navLinks = `
            <li class="nav-item"><a class="nav-link" href="${dashLink}">Dashboard</a></li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i>${user.name}
                </a>
                <ul class="dropdown-menu dropdown-menu-dark">
                    <li><a class="dropdown-item" href="${dashLink}"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </li>
        `;
    }

    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-custom fixed-top">
            <div class="container">
                <a class="navbar-brand" href="/">🎓 Prashikshan</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto align-items-center gap-1">
                        ${navLinks}
                    </ul>
                </div>
            </div>
        </nav>`;
    }
}

// ===== Utility Functions =====
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function getStatusBadge(status) {
    const map = {
        'applied': '<span class="badge-custom badge-info">Applied</span>',
        'shortlisted': '<span class="badge-custom badge-warning">Shortlisted</span>',
        'interview': '<span class="badge-custom badge-primary">Interview</span>',
        'selected': '<span class="badge-custom badge-success">Selected</span>',
        'rejected': '<span class="badge-custom badge-danger">Rejected</span>',
        'active': '<span class="badge-custom badge-success">Active</span>',
        'closed': '<span class="badge-custom badge-danger">Closed</span>',
        'draft': '<span class="badge-custom badge-warning">Draft</span>',
        'upcoming': '<span class="badge-custom badge-info">Upcoming</span>',
        'ongoing': '<span class="badge-custom badge-warning">Ongoing</span>',
        'completed': '<span class="badge-custom badge-success">Completed</span>',
        'cancelled': '<span class="badge-custom badge-danger">Cancelled</span>',
    };
    return map[status] || `<span class="badge-custom badge-info">${status}</span>`;
}

function renderSkillTags(skills) {
    if (!skills || !Array.isArray(skills)) return '';
    return skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
}

function getPriorityBadge(priority) {
    const map = {
        'high': '<span class="badge-custom badge-danger">High</span>',
        'medium': '<span class="badge-custom badge-warning">Medium</span>',
        'low': '<span class="badge-custom badge-success">Low</span>',
    };
    return map[priority] || '';
}
