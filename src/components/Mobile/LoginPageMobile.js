import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './LoginPageMobile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';

function LoginPageMobile() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed. Please check your credentials.');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                const decodedToken = jwtDecode(data.token);
                navigate("/FrontendDMS/mobileHome");
            } else {
                throw new Error('Invalid login attempt.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container-m">
            <header className="login-header-m">
                <img src="logo.webp" alt="logo" className="logo-m" />
            </header>
            <div className="login-box-m">
                <h2 className='heading-mobile-login'>Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group-m">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group-m">
                        <label>Password</label>
                        <div className="password-container-m">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-m"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>
                    {error && <div className="error-message-m">{error}</div>}
                    <button type="submit" className="login-button-m">Login</button>
                    <button type="button" className="forgot-button-m" onClick={() => navigate('/FrontendDMS/mobileForgot')}>
                        Forgot Password?
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPageMobile;
