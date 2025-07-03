import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';
import Loader from "../universal/Loader";


const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedSession = useRef(false); // Prevent double execution
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const { showNotification } = useNotification();

  useEffect(() => {
    setIsLoading(true);

    if (hasCheckedSession.current) return; // Skip if already checked
    hasCheckedSession.current = true;

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
      setIsLoading(false);

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
          // Check for blocked user
          if (response.status === 403 && errorData.error === 'User is blocked') {
            showNotification("error", "Your account has been blocked. Please contact support.");
            return;
          }else if (response.status === 401) {
            showNotification("warning", "Invalid password. Please try again.");
            return;
          }else if (response.status === 404) {
            showNotification("warning", "User not found. Please check your username.");
            return;
          }
          errorMsg = errorData.error || response.statusText;
        } catch (jsonError) {
          console.error('Invalid JSON response:', jsonError);
        }
        showNotification("warning", errorMsg);
        return;
      }

      const data = await response.json();
      navigate('/', { state: { message: 'You have successfully logged in!', type: 'success' } });
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification('warning', 'Failed to connect to the server. Please try again later.');
      console.log(backendUrl);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  if (isLoading) {
    return (
      <Loader></Loader>
    );
  }

  return (
    <div className="body">
      <section className="login-section">
        <div className="w-layout-blockcontainer container w-container">
          <div className="content-wapper">
            <div className="image-div-3">
              <img
                src="\assets\Icons\login-background.svg"
                loading="lazy"
                alt="Login Illustration"
                className="image-30"
              />
            </div>
            <div className="login-form-div">
              <div className="login-form-block w-form">
                <form onSubmit={handleSubmit} className="login-form">
                  <label htmlFor="username" className='Field Label 2'>Username</label>
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
                  <label className='Field Label 2' htmlFor="password">Password</label>
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
                    className="submit-button-3 w-button"
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
