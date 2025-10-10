import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faEye, faEyeSlash, faWifi, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import CryptoJS from "crypto-js";
import AccountLockOut from '../AccountLockout/AccountLockOut';
import { ToastContainer, toast } from 'react-toastify';
import SplashScreen from '../Construction/SplashScreen';
import { getCurrentUser, can } from "../../utils/auth";

const VisitorOTPLogin = () => {
    const id = useParams().id;
    const [username, setUsername] = useState('');
    const [otp, setOTP] = useState('');
    const [surname, setSurname] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [locked, setLocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loadingScreen, setLoadingScreen] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log(id);
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/visitors/verify-otp-login/${id}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ otp: otp }),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(data?.message || 'OTP verification failed');
                return;
            }

            navigate("/FrontendDMS/visitorHomePage");
        } catch (err) {
            setError(err.message || 'Something went wrong');
            setTimeout(() => setError(''), 3000);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };


    return (
        <div className='type-selector-overlay'>
            <div className="nl-login-container-otp">
                <div className="nl-login-card">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} className='nl-logo-img' />
                    <div className="nl-login-title">ComplianceHub{"\u2122"}</div>
                    <form onSubmit={handleSubmit}>
                        <div className="nl-form-group">
                            <div className="nl-input-container">
                                <i><FontAwesomeIcon icon={faIdBadge} /></i>
                                <input
                                    type="text"
                                    id="otp"
                                    placeholder="Insert your OTP"
                                    value={otp}
                                    onChange={(e) => setOTP(e.target.value)}
                                    required
                                    className={error.length !== 0 ? `nl-surround` : ""}
                                />
                            </div>
                        </div>

                        <div className="nl-login-error">{error}</div>

                        <div className="nl-login-button-container">
                            <button type="submit" className="nl-login-button">{loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Log In'}</button>
                        </div>
                    </form>

                    <div className="nl-logo-bottom-container">
                        <img className="nl-logo-bottom" src={`${process.env.PUBLIC_URL}/logo.webp`} alt="Bottom Logo" />
                        <p className="nl-logo-bottom-text">A TAU5 PRODUCT</p>
                    </div>

                    <div className="nl-logo-bottom-container-right">
                        <p className="nl-logo-bottom-text-right">Version: {`${process.env.REACT_APP_VERSION}`}</p>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default VisitorOTPLogin;