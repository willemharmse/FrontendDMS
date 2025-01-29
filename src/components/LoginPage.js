import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom'; // Import useLocation for getting URL query parameters
import { jwtDecode } from 'jwt-decode'; // You'll need to install jwt-decode: npm install jwt-decode
import './LoginPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); // Access the current URL
  const searchParams = new URLSearchParams(location.search); // Parse query parameters
  const redirectPath = searchParams.get('redirect') || '/dashboard'; // Get 'redirect' parameter or fallback to '/dashboard'

  const handleLogin = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data = await response.json();

      // Store token and decode it to check user role
      if (data.token) {
        localStorage.setItem('token', data.token); // Store the token
        const decodedToken = jwtDecode(data.token); // Decode the token to get user role
        const userRole = decodedToken.role; // Assuming role is stored in token as 'role'

        navigate('/FrontendDMS/home'); // Redirect to the dashboard
      } else {
        throw new Error('Invalid login attempt.');
      }
    } catch (err) {
      setError(err.message); // Display the error to the user
    }
  };

  return (
    <div className="login-container">
      <div className='login-header'>
        <header className="landing-header">
          <div className="header-content">
            <img src="logo.webp" alt="logo" className="responsive-logo" />
          </div>
        </header>
      </div>
      <div className='login-page-box'>
        <h2>Login</h2>
        <div className="login-box">
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="login-password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="show-hide-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                </button>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button">Login</button>
            <button className="forgot-button" onClick={() => { navigate('/FrontendDMS/forgot') }}>Forgot Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
