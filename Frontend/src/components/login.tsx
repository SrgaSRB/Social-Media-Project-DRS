import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';

const loadCSS = (href: string) => {
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.getAttribute('href') !== href) {
      link.remove();
    }
  });

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (!existingLink) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = "/styles/notification.css";
  document.head.appendChild(link);
};

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedSession = useRef(false); // Prevent double execution
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const { showNotification } = useNotification();

  useEffect(() => {
    loadCSS('/styles/login.css');
    setTimeout(() => setIsLoading(false), 200);

    if (hasCheckedSession.current) return; // Skip if already checked
    hasCheckedSession.current = true;

    console.log(backendUrl);
    console.log(process.env);

    fetch(`${backendUrl}/api/auth/session`, { method: 'GET', credentials: 'include' })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('No active session');
      })
      .then((data) => {
        if (data.user) {
          const logoutConfirm = window.confirm('Already logged in. Do you want to log out?');
          if (logoutConfirm) {
            handleLogout();
          } else {
            navigate('/');
          }
        }
      })
      .catch(() => console.log('No active session'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMsg = 'Login failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || response.statusText;
        } catch (jsonError) {
          console.error('Invalid JSON response:', jsonError);
        }
        alert(errorMsg);
        return;
      }

      const data = await response.json();
      navigate('/', { state: { message: 'You have successfully logged in!', type: 'success' } });
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification('warning', 'Failed to connect to the server. Please try again later.');
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  if (isLoading) {
    return (
      <div className="preloader">
        <div className="spinner"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="body">
      <section className="hero-section">
        <div className="w-layout-blockcontainer container hero-container w-container">
          <div className="content-wapper">
            <div className="image-div">
              <img
                src="\assets\Icons\login-background.svg"
                loading="lazy"
                alt="Login Illustration"
                className="image-2"
              />
            </div>
            <div className="login-form-div">
              <div className="form-block w-form">
                <form onSubmit={handleSubmit} className="form">
                  <label htmlFor="username">Username</label>
                  <input
                    className="text-field w-input"
                    maxLength={256}
                    name="username"
                    placeholder="Enter your username"
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <label htmlFor="password">Password</label>
                  <input
                    className="text-field w-input"
                    maxLength={256}
                    name="password"
                    placeholder="Enter your password"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <input
                    type="submit"
                    className="submit-button w-button"
                    value="Login"
                  />
                  <a
                    href="#"
                    className="link-2"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRegisterRedirect();
                    }}
                  >
                    Don't have an account?
                  </a>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
