import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import './ForgotPassword.css';

function ForgotPassword() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // To track the current step
    const [error, setError] = useState('');
    const [deadlineMs, setDeadlineMs] = useState(null); // absolute end time
    const [nowMs, setNowMs] = useState(Date.now());
    const navigate = useNavigate();
    const [newPasswordInvalid, setNewPasswordInvalid] = useState(false);
    const [confirmPasswordInvalid, setConfirmPasswordInvalid] = useState(false);
    const [resending, setResending] = useState(false);

    const getPasswordErrors = (password) => {
        const errors = [];

        if (password.length < 8) {
            errors.push("Less than 8 characters");
        }

        if (!/[A-Z]/.test(password)) {
            errors.push("No capital letters");
        }

        if (!/[0-9]/.test(password)) {
            errors.push("No number");
        }

        if (!/[!?@]/.test(password)) {
            errors.push("No special characters (! ? @)");
        }

        return errors;
    };

    const showPasswordValidationToast = (errors) => {
        toast.dismiss();
        toast.clearWaitingQueue();
        toast.error(
            `Password is invalid:\n${errors.join("\n")}`,
            {
                closeButton: false,
                autoClose: 2500,
                style: { textAlign: "left", whiteSpace: "pre-line" }
            }
        );
    };

    useEffect(() => {
        if (step !== 2 || !deadlineMs) return;
        setNowMs(Date.now());
        const id = setInterval(() => setNowMs(Date.now()), 100); // smooth countdown
        return () => clearInterval(id);
    }, [step, deadlineMs]);

    const msLeft = Math.max(0, (deadlineMs ?? 0) - nowMs);
    const formatMs = (ms) => {
        const totalSec = Math.ceil(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleResendOtp = async () => {
        if (msLeft > 0 || resending) return;

        setResending(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ username, email }),
            });

            if (!response.ok) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.error('Could not resend OTP, please try again.', {
                    closeButton: false,
                    autoClose: 800,
                    style: { textAlign: 'center' },
                });
                return;
            }

            setOtp('');
            setDeadlineMs(Date.now() + 120000);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success('A new OTP has been sent.', {
                closeButton: false,
                autoClose: 800,
                style: { textAlign: 'center' },
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setResending(false);
        }
    };

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
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ username, email }),
                });

                if (!response.ok) {
                    toast.dismiss();
                    toast.clearWaitingQueue();
                    toast.error('Invalid username or email.', {
                        closeButton: false,
                        autoClose: 800,
                        style: {
                            textAlign: 'center',
                        },
                    });
                }
                else {
                    setDeadlineMs(Date.now() + 120000);
                    setStep(2);
                }
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
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ username, otp }),
                });

                if (!response.ok) {
                    // Try to read the JSON body and grab the message
                    let errorMessage = 'Something went wrong';
                    try {
                        const data = await response.json();
                        if (data?.message) {
                            errorMessage = data.message;
                        }
                    } catch {
                        // fallback if response is not JSON
                        errorMessage = await response.text();
                    }

                    toast.dismiss();
                    toast.clearWaitingQueue();
                    toast.error(errorMessage, {
                        closeButton: false,
                        autoClose: 800,
                        style: { textAlign: 'center' },
                    });
                    return;
                }

                setStep(3);
            } catch (err) {
                setError(err.message);
            }
        } else if (step === 3) {
            // Step 3: New Password and Confirm Password
            setNewPasswordInvalid(false);
            setConfirmPasswordInvalid(false);

            const passwordErrors = getPasswordErrors(newPassword.trim());

            if (passwordErrors.length > 0) {
                setNewPasswordInvalid(true);
                setConfirmPasswordInvalid(true);
                showPasswordValidationToast(passwordErrors);
                return;
            }

            if (newPassword !== confirmPassword) {
                setNewPasswordInvalid(true);
                setConfirmPasswordInvalid(true);
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.error('Passwords do not match.', {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center',
                    },
                });
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ username, newPassword }),
                });

                if (!response.ok) {
                    toast.dismiss();
                    toast.clearWaitingQueue();
                    toast.error('Password could not be reset, contact Admin.', {
                        closeButton: false,
                        autoClose: 800,
                        style: {
                            textAlign: 'center',
                        },
                    });
                }
                else {
                    toast.dismiss();
                    toast.clearWaitingQueue();
                    toast.success("Password has been reset", {
                        closeButton: false,
                        autoClose: 800,
                        style: {
                            textAlign: 'center',
                        },
                    });
                }
            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} className='forgot-password-logo-img' />
                <div className="forgot-password-title">{"Reset Password"}</div>
                <form onSubmit={handleLogin}>
                    {step === 1 && (
                        <>
                            <div className="forgot-password-group">
                                <label className="forgot-password-label">Username</label>
                                <div className="forgot-password-input-container">
                                    <input
                                        type="text"
                                        placeholder="Insert Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="forgot-password-group">
                                <label>Email</label>
                                <div className="forgot-password-input-container">
                                    <input
                                        placeholder='Insert Email'
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="forgot-password-group">
                            <label
                                className="forgot-password-label"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                Insert OTP
                                <span style={{ fontWeight: 500 }}>
                                    {deadlineMs && msLeft > 0 ? (
                                        `(Expires in ${formatMs(msLeft)})`
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resending}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                                color: 'white',
                                                fontWeight: 600,
                                                textDecoration: 'underline',
                                                cursor: resending ? 'default' : 'pointer',
                                            }}
                                        >
                                            {resending ? 'Resending...' : 'Resend OTP'}
                                        </button>
                                    )}
                                </span>
                            </label>
                            <div className="forgot-password-input-container">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <>
                            <div className="forgot-password-group">
                                <label className="forgot-password-label">New Password</label>
                                <div className="forgot-password-input-container">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            setNewPasswordInvalid(false);
                                        }}
                                        className={newPasswordInvalid ? "password-invalid" : ""}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="forgot-password-group">
                                <label className="forgot-password-label">Confirm Password</label>
                                <div className="forgot-password-input-container">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setConfirmPasswordInvalid(false);
                                        }}
                                        className={confirmPasswordInvalid ? "password-invalid" : ""}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="forgot-password-button-container">
                        <button type="submit" className="forgot-password-button">{step === 1 ? 'Request OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'}</button>
                        <button className="forgot-password-button" onClick={() => navigate(-1)}>Back</button>
                    </div>
                </form>

                <div className="logo-bottom-container">
                    <img className="logo-bottom" src={`${process.env.PUBLIC_URL}/logo.webp`} alt="Bottom Logo" />
                    <p className="logo-bottom-text">A TAU5 PRODUCT</p>
                </div>
            </div >
            <ToastContainer />
        </div >
    );
}

export default ForgotPassword;