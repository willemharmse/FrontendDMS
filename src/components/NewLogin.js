import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useLocation for getting URL query parameters
import { jwtDecode } from 'jwt-decode'; // You'll need to install jwt-decode: npm install jwt-decode
import './NewLogin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const NewLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    useEffect(() => {
        const storedRememberMe = localStorage.getItem('rememberMe') === 'true';
        const storedToken = storedRememberMe ? localStorage.getItem('token') : sessionStorage.getItem('token');

        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                setUsername(decodedToken.username || ''); // Pre-fill username if available
                setRememberMe(storedRememberMe);
                navigate('/FrontendDMS/home'); // Redirect if already logged in
            } catch (err) {
                console.error('Invalid token:', err);
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed. Please check your credentials.');
            }

            const data = await response.json();

            if (data.token) {
                // Store token based on "Remember Me" selection
                if (rememberMe) {
                    localStorage.setItem('token', data.token); // Persistent login
                    localStorage.setItem('rememberMe', 'true'); // Remember the preference
                } else {
                    localStorage.setItem('token', data.token); // Temporary login
                    localStorage.removeItem('rememberMe'); // Clear rememberMe flag if unchecked
                }

                const decodedToken = jwtDecode(data.token);
                navigate('/FrontendDMS/home'); // Redirect to home/dashboard
            } else {
                throw new Error('Invalid login attempt.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="nl-login-container">
            <div className="nl-login-card">
                <img src='CH_Logo.png' className='nl-logo-img' />
                <div className="nl-login-title">ComplianceHub</div>

                <form onSubmit={handleSubmit}>
                    <div className="nl-form-group">
                        <div className="nl-input-container">
                            <i><FontAwesomeIcon icon={faUser} /></i>
                            <input
                                type="text"
                                id="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="nl-form-group">
                        <div className="nl-input-container">
                            <i><FontAwesomeIcon icon={faLock} /></i>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="nl-password-toggle"
                                onClick={togglePasswordVisibility}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    <div className="nl-options-row">
                        <label className="nl-remember-me">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Remember Me
                        </label>
                        <a onClick={() => navigate("/FrontendDMS/forgot")} className="nl-forgot-password">Forgot Password?</a>
                    </div>

                    <div className="nl-login-button-container">
                        <button type="submit" className="nl-login-button">{loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Log In'}</button>
                    </div>
                </form>

                <div className="logo-bottom-container">
                    <img className="logo-bottom" src="logo.webp" alt="Bottom Logo" />
                    <p className="logo-bottom-text">A TAU5 PRODUCT</p>
                </div>
            </div>
        </div>
    );
};

export default NewLogin;
