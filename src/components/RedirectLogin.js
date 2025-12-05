import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './NewLogin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faEye, faEyeSlash, faWifi } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import CryptoJS from "crypto-js";
import AccountLockOut from './AccountLockout/AccountLockOut';
import { ToastContainer, toast } from 'react-toastify';
import SplashScreen from './Construction/SplashScreen';
import { getCurrentUser, can } from "../utils/auth";

const RedirectLogin = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);

    const type = useParams().type;
    const id = useParams().id;
    const module = useParams().module;
    const actionRequired = useParams().action;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [locked, setLocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loadingScreen, setLoadingScreen] = useState(true);

    const secret = process.env.REACT_APP_SECRET;

    const closeLoading = () => {
        setLoadingScreen(false);
        sessionStorage.setItem('splashScreenDone', 'true');
    }

    useEffect(() => {
        if (sessionStorage.getItem('splashScreenDone') === 'true') {
            setLoadingScreen(false);
        }
    }, [])

    const toggleLocked = () => {
        setLocked(!locked);
    }

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    async function fetchAndCacheProfilePic(userId, token) {
        try {
            const resp = await fetch(`${process.env.REACT_APP_URL}/api/user/${userId}/profile-picture`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (resp.status === 200) {
                const blob = await resp.blob();
                // Convert Blob -> data URL so we can store it in sessionStorage (strings only)
                const toDataURL = (blob) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                const dataUrl = await toDataURL(blob);
                sessionStorage.setItem('profilePic', dataUrl);
                console.log(getCurrentUser());
            } else {
                // 204 (no content) or 404 -> keep icon
                sessionStorage.removeItem('profilePic');
            }
        } catch {
            // Network or other error -> fall back to icon
            sessionStorage.removeItem('profilePic');
        }
    }

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
    }, [navigate, secret]);

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

    const getPostLoginPath = () => {
        if (module === 'RMS') {
            if (actionRequired === "draft") {
                if (type === "IBRA") {
                    return `/FrontendDMS/riskIBRA/IBRA/${id}`;
                }
                if (type === "BLRA") {
                    return `/FrontendDMS/riskBLRA/BLRA/${id}`;

                }
                if (type === "JRA") {
                    return `/FrontendDMS/riskJRA/JRA/${id}`;
                }
            }
            else {
                return `/FrontendDMS/home`;
            }
        }

        if (module === 'TMS') {
            if (actionRequired === "draft") {
                return `/FrontendDMS/inductionCreation/${id}`;
            }
            else if (actionRequired === "approveDraft") {
                return `/FrontendDMS/inductionCreation/${id}`;
            }
            else if (actionRequired === "approvePublished") {
                return `/FrontendDMS/inductionReview/${id}`;
            }
            else {
                return `/FrontendDMS/home`;
            }
        }

        if (module === 'DDS') {
            if (actionRequired === "draft") {
                if (type === "Special Instruction") {
                    return `/FrontendDMS/documentCreateSI/Special Instruction/${id}`;
                }
                if (type === "Procedure") {
                    return `/FrontendDMS/documentCreateProc/Procedure/${id}`;

                }
                if (type === "Standard") {
                    return `/FrontendDMS/documentCreateStand/Standard/${id}`;
                }
            }
            else {
                return `/FrontendDMS/home`;
            }
        }

        // Fallback if params missing / invalid
        return '/FrontendDMS/home';
    };


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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.status === 423) {
                toggleLocked();
                return;
            }

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
                const userId = decodedToken.userId;

                await fetchAndCacheProfilePic(userId, data.token);

                const path = getPostLoginPath();
                navigate(path);
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
                                id="username"
                                placeholder="Insert your username"
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

                    <div className="nl-options-row">
                        <label className="nl-remember-me">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Remember Me
                        </label>
                        <a onClick={() => navigate("/forgot")} className="nl-forgot-password">Forgot Password?</a>
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

            {locked && (<AccountLockOut toggleLocked={toggleLocked} />)}
            {loadingScreen && (<SplashScreen logoSrc={`${process.env.PUBLIC_URL}/CH_Logo.svg`} onDone={closeLoading} pingUrl={`${process.env.REACT_APP_URL}/ping`} />)}
            <ToastContainer />
        </div>
    );
};

export default RedirectLogin;
