import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPasswordMobile.css';

function ForgotPasswordMobile() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (step === 1) {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/request-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email }),
                });

                if (!response.ok) throw new Error('Invalid username or email.');
                setStep(2);
            } else if (step === 2) {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, otp }),
                });

                if (!response.ok) throw new Error('Invalid OTP.');
                setStep(3);
            } else if (step === 3) {
                if (newPassword.length < 8 || confirmPassword.length < 8) {
                    setError('Password must be at least 8 characters.');
                    return;
                }
                if (newPassword !== confirmPassword) {
                    setError('Passwords do not match.');
                    return;
                }

                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, newPassword }),
                });

                if (!response.ok) throw new Error('Failed to reset password.');
                navigate('/FrontendDMS/');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="forgot-mobile-container">
            <header className="forgot-mobile-header">
                <img src="logo.webp" alt="logo" className="forgot-mobile-logo" />
            </header>
            <div className="forgot-mobile-box">
                <h2 className='forgot-mobile-heading'>
                    {step === 1 ? 'Insert Username & Email' : step === 2 ? 'Insert OTP' : 'Set New Password'}
                </h2>
                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <>
                            <div className="forgot-mobile-input-group">
                                <label>Username</label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            </div>
                            <div className="forgot-mobile-input-group">
                                <label>Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="forgot-mobile-input-group">
                            <label>Insert OTP</label>
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                        </div>
                    )}

                    {step === 3 && (
                        <>
                            <div className="forgot-mobile-input-group">
                                <label>New Password</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <div className="forgot-mobile-input-group">
                                <label>Confirm Password</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                        </>
                    )}

                    {error && <div className="forgot-mobile-error">{error}</div>}
                    <button type="submit" className="forgot-mobile-button">
                        {step === 1 ? 'Request OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ForgotPasswordMobile;
