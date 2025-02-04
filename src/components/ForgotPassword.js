import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './LoginPage.css';

function ForgotPassword() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // To track the current step
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        if (step === 1) {
            // Step 1: Username and Email, Request OTP
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/request-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email }),
                });

                if (!response.ok) {
                    throw new Error('Invalid username.');
                }

                // Proceed to the OTP step
                setStep(2);
            } catch (err) {
                setError(err.message);
            }
        } else if (step === 2) {
            // Step 2: OTP, Verify OTP
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/verify-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, otp }),
                });

                if (!response.ok) {
                    throw new Error('Invalid OTP.');
                }

                // Proceed to the password change step
                setStep(3);
            } catch (err) {
                setError(err.message);
            }
        } else if (step === 3) {
            // Step 3: New Password and Confirm Password
            if (newPassword.length < 8 || confirmPassword.length < 8) {
                setError('Password must be at least 8 characters.');
                return;
            }

            if (newPassword !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, newPassword }),
                });

                if (!response.ok) {
                    throw new Error('Failed to reset password.');
                }

                // Redirect to login page or home after successful reset
                navigate('/FrontendDMS/'); // Redirect to login page
            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <header className="landing-header">
                    <div className="header-content">
                        <img src="logo.webp" alt="logo" className="responsive-logo" />
                    </div>
                </header>
            </div>
            <div className="login-page-box">
                <h2>{step === 1 ? 'Enter Username and Email' : step === 2 ? 'Enter OTP' : 'Set New Password'}</h2>
                <div className="login-box">
                    <form onSubmit={handleLogin}>
                        {step === 1 && (
                            <>
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
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="input-group">
                                <label>Enter OTP</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <>
                                <div className="input-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" className="login-button">{step === 1 ? 'Request OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
