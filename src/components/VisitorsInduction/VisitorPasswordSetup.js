import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';

const VisitorPasswordSetup = () => {
    const { id } = useParams();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length <= 8) {
            toast.error('Password must be more than 8 characters.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/visitors/createPassword/${id}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password }),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(data?.message || 'Password setup failed. Please try again.');
                return;
            }

            navigate("/FrontendDMS/visitorLogin");
        } catch (err) {
            setError(err.message || 'Something went wrong');
            setTimeout(() => setError(''), 3000);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className='type-selector-overlay'>
            <div className="nl-login-container-otp">
                <div className="nl-login-card">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} className='nl-logo-img' />
                    <div className="nl-login-title" style={{ marginBottom: "20px" }}>ComplianceHub{"\u2122"}</div>
                    <label
                        className="forgot-password-label"
                        style={{
                            display: "block",
                            textAlign: "center",
                            marginBottom: "30px",
                            fontWeight: "normal",
                            fontSize: "16px",
                            color: "white"
                        }}
                    >
                        Set a password for your Visitor Profile login.
                    </label>
                    <form onSubmit={handleSubmit}>
                        <div className="nl-form-group">
                            <label className="forgot-password-label">
                                Create Password
                            </label>
                            <div className="nl-input-container">
                                <i><FontAwesomeIcon icon={faLock} /></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="Insert password"
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

                        <div className="nl-login-error">{error}</div>

                        <div className="nl-login-button-container">
                            <button type="submit" className="nl-login-button">{loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Submit'}</button>
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

export default VisitorPasswordSetup;