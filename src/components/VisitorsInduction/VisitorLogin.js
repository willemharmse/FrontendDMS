import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faEye, faEyeSlash, faWifi, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import CryptoJS from "crypto-js";
import AccountLockOut from '../AccountLockout/AccountLockOut';
import { ToastContainer, toast } from 'react-toastify';
import SplashScreen from '../Construction/SplashScreen';
import { getCurrentUser, can } from "../../utils/auth";

const VisitorLogin = () => {
    const [username, setUsername] = useState('');
    const [id, setId] = useState('');
    const [surname, setSurname] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [locked, setLocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loadingScreen, setLoadingScreen] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const secret = process.env.REACT_APP_SECRET;

    const closeLoading = () => {
        setLoadingScreen(false);
        sessionStorage.setItem('splashScreenDone', 'true');
    }

    useEffect(() => {
        const showOfflineToast = () => {
            toast.dismiss('network-error');
            toast.info("No Internet Connection", {
                toastId: 'network-error',
                autoClose: false,
                closeButton: false,
                position: "top-right",
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                className: 'toast-network-wrapper',      // 🟡 outer wrapper (Toast)
                bodyClassName: 'toast-network-body',
                icon: <FontAwesomeIcon icon={faWifi} size="lg" />,
            });
        };

        const hideOfflineToast = () => {
            toast.dismiss('network-error');
        };

        if (!navigator.onLine) {
            showOfflineToast();
        }

        window.addEventListener('offline', showOfflineToast);
        window.addEventListener('online', hideOfflineToast);

        return () => {
            window.removeEventListener('offline', showOfflineToast);
            window.removeEventListener('online', hideOfflineToast);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!navigator.onLine) {
            const toastContainer = document.querySelector('.Toastify__toast-container');
            if (toastContainer) {
                toastContainer.classList.add('toast-offline-alert');
                toastContainer.classList.add('margin-remover-login');

                // Remove the effect after animation finishes
                setTimeout(() => {
                    toastContainer.classList.remove('toast-offline-alert');
                    toastContainer.classList.remove('margin-remover-login');
                }, 1000);
            }

            toast.info("No Internet Connection", {
                toastId: 'network-error',
                autoClose: false,
                closeButton: false,
                position: "top-right",
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                className: 'toast-network-wrapper',      // 🟡 outer wrapper (Toast)
                bodyClassName: 'toast-network-body',
                icon:
                    <FontAwesomeIcon icon={faWifi} size="lg" />

            });

            return; // Prevent further execution
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/visitors/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) throw new Error('Login failed. Please check your credentials.');

            const data = await response.json();

            if (data.token) {
                const decodedToken = jwtDecode(data.token);
                const userId = decodedToken.userId;

                sessionStorage.setItem("visitorToken", data.token);

                navigate(`/FrontendDMS/visitorHomePage`);
            } else {
                throw new Error('Invalid login attempt.');
            }
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {

            } else {
                setError(err.message);
                setTimeout(() => setError(''), 3000);
            }
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="nl-login-container">
            <div className="nl-login-card">
                <img src='CH_Logo.svg' className='nl-logo-img' />
                <div className="nl-login-title">ComplianceHub{"\u2122"}</div>
                <form onSubmit={handleSubmit}>
                    <div className="nl-form-group">
                        <div className="nl-input-container">
                            <i><FontAwesomeIcon icon={faUser} /></i>
                            <input
                                type="text"
                                id="email"
                                placeholder="Insert Registered Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                placeholder="Insert your password"
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

                    <div className="nl-options-row" style={{ marginBottom: "5px" }}>
                        <a onClick={() => navigate("/FrontendDMS/resetVisitorPassword")} className="nl-forgot-password-visitor">Reset Password</a>
                    </div>

                    <div className="nl-login-error">{error}</div>

                    <div className="nl-login-button-container">
                        <button type="submit" className="nl-login-button">{loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Log In'}</button>
                    </div>
                </form>

                <div className="nl-logo-bottom-container">
                    <img className="nl-logo-bottom" src="logo.webp" alt="Bottom Logo" />
                    <p className="nl-logo-bottom-text">A TAU5 PRODUCT</p>
                </div>

                <div className="nl-logo-bottom-container-right">
                    <p className="nl-logo-bottom-text-right">Version: {`${process.env.REACT_APP_VERSION}`}</p>
                </div>
            </div>

            {loadingScreen && (<SplashScreen logoSrc={`${process.env.PUBLIC_URL}/CH_Logo.svg`} onDone={closeLoading} pingUrl={`${process.env.REACT_APP_URL}/ping`} />)}
            <ToastContainer />
        </div>
    );
};

export default VisitorLogin;
