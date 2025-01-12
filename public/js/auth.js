const API_URL = '/api';

// Authentication functions
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    
    alert('Successfully logged in!');
    window.location.href = '/';
    return data;
  } catch (error) {
    alert(error.message);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('Please fill in all required fields');
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    
    alert('Successfully registered!');
    window.location.href = '/';
    return data;
  } catch (error) {
    alert(error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
    });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const checkAuth = () => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  return { isAuthenticated: !!token, user: user ? JSON.parse(user) : null };
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const { isAuthenticated, user } = checkAuth();
  updateUI(isAuthenticated, user);

  // Login form handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await login(email, password);
      } catch (error) {
        console.error('Login error:', error);
      }
    });
  }

  // Register form handler
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        graduationYear: document.getElementById('graduationYear').value,
        degree: document.getElementById('degree').value,
        major: document.getElementById('major').value,
      };
      try {
        await register(formData);
      } catch (error) {
        console.error('Registration error:', error);
      }
    });
  }

  // Logout button handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});

// UI update function
export const updateUI = (isAuthenticated, user) => {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const profileLink = document.getElementById('profile-link');
  const adminControls = document.getElementById('admin-controls');

  if (isAuthenticated) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (profileLink) profileLink.style.display = 'block';
    
    // Show admin controls if user is admin
    if (adminControls && user.role === 'admin') {
      adminControls.style.display = 'block';
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
    if (adminControls) adminControls.style.display = 'none';
  }
};