// Shared auth logic: protects app pages, wires up the account icon (sign in / log out).
window.TradePilotAuth = {
  getToken: function () {
    return localStorage.getItem('tradepilot_token');
  },
  getUser: function () {
    try {
      return JSON.parse(localStorage.getItem('tradepilot_user'));
    } catch (err) {
      return null;
    }
  },
  authHeader: function () {
    const token = localStorage.getItem('tradepilot_token');
    return token ? { Authorization: 'Bearer ' + token } : {};
  },
  logout: function () {
    localStorage.removeItem('tradepilot_token');
    localStorage.removeItem('tradepilot_user');
    window.location.href = 'signin.html';
  }
};

document.addEventListener('DOMContentLoaded', function () {
  const requiresAuth = document.body.getAttribute('data-auth') === 'required';
  const token = window.TradePilotAuth.getToken();
  const user = window.TradePilotAuth.getUser();

  // Protect app pages: bounce to sign-in if not logged in
  if (requiresAuth && !token) {
    window.location.href = 'signin.html';
    return;
  }

  // Wire up the account icon in the top nav
  const accountBtn = document.getElementById('nav-account-btn');
  if (accountBtn) {
    if (token && user) {
      accountBtn.title = 'Signed in as ' + user.name + ' — click to log out';
      accountBtn.setAttribute('href', '#');
      accountBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('Log out of TradePilot?')) {
          window.TradePilotAuth.logout();
        }
      });
    } else {
      accountBtn.title = 'Sign in';
      accountBtn.setAttribute('href', 'signin.html');
    }
  }
});
