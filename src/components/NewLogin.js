import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useLocation for getting URL query parameters
import { jwtDecode } from 'jwt-decode'; // You'll need to install jwt-decode: npm install jwt-decode
import './NewLogin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import CryptoJS from "crypto-js";

const NewLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const secret = process.env.REACT_APP_SECRET;

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    useEffect(() => {
        const storedRememberMe = localStorage.getItem('rememberMe') === 'true';
        const storedToken = storedRememberMe ? localStorage.getItem('token') : sessionStorage.getItem('token');

        if (storedRememberMe) {
            const encryptedUsername = localStorage.getItem('savedUsername');
            const encryptedPassword = localStorage.getItem('savedPassword');

            if (encryptedUsername && encryptedPassword && secret) {
                try {
                    const decryptedUsername = CryptoJS.AES.decrypt(encryptedUsername, secret).toString(CryptoJS.enc.Utf8);
                    const decryptedPassword = CryptoJS.AES.decrypt(encryptedPassword, secret).toString(CryptoJS.enc.Utf8);
                    setUsername(decryptedUsername);
                    setPassword(decryptedPassword);
                    setRememberMe(true);
                } catch (err) {
                    console.error('Failed to decrypt saved credentials:', err);
                }
            }
        }

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
    }, [navigate, secret]);

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

            if (!response.ok) throw new Error('Login failed. Please check your credentials.');

            const data = await response.json();

            if (data.token) {
                if (rememberMe) {
                    if (!data.firstLogin) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('rememberMe', 'true');
                        localStorage.setItem('savedUsername', CryptoJS.AES.encrypt(username, secret).toString());
                        localStorage.setItem('savedPassword', CryptoJS.AES.encrypt(password, secret).toString());
                        localStorage.setItem('firstLogin', 'false');
                    } else {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('rememberMe', 'true');
                        localStorage.setItem('savedUsername', CryptoJS.AES.encrypt(username, secret).toString());
                        localStorage.setItem('savedPassword', CryptoJS.AES.encrypt(password, secret).toString());
                        localStorage.setItem('firstLogin', 'true');
                    }
                } else {
                    if (!data.firstLogin) {
                        localStorage.setItem('token', data.token);
                        localStorage.removeItem('rememberMe');
                        localStorage.setItem('firstLogin', 'false');
                    }
                    else {
                        localStorage.setItem('token', data.token);
                        localStorage.removeItem('rememberMe');
                        localStorage.setItem('firstLogin', 'true');
                    }
                }

                const decodedToken = jwtDecode(data.token);
                navigate('/FrontendDMS/home'); // Redirect to home/dashboard
            } else {
                throw new Error('Invalid login attempt.');
            }
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    };


    return (
        <div className="nl-login-container">
            <div className="nl-login-card">
                <img src='CH_Logo.png' className='nl-logo-img' />
                <div className="nl-login-title">ComplianceHub{"\u2122"}</div>
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
                                className={error.length !== 0 ? `nl-surround` : ""}
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
                                className={error.length !== 0 ? `nl-surround` : ""}
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

                    <div className="nl-login-error">{error}</div>

                    <div className="nl-login-button-container">
                        <button type="submit" className="nl-login-button">{loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Log In'}</button>
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
