import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';

function ResetVisitorPassword() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // To track the current step
    const [error, setError] = useState('');
    const [deadlineMs, setDeadlineMs] = useState(null); // absolute end time
    const [nowMs, setNowMs] = useState(Date.now());
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/visitors/request-reset-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ email }),
                });

                if (!response.ok) {
                    toast.dismiss();
                    toast.clearWaitingQueue();
                    toast.error('Invalid email.', {
                        closeButton: false,
                        autoClose: 800,
                        style: {
                            textAlign: 'center',
                        },
                    });
                }
                else {
                    setDeadlineMs(Date.now() + 5 * 60 * 1000);
                    setStep(2);
                }
            } catch (err) {
                setError(err.message);
            }
        } else if (step === 2) {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/visitors/verify-reset-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ email, otp }),
                });

                if (!response.ok) {
                    let errorMessage = 'Something went wrong';
                    try {
                        const data = await response.json();
                        if (data?.message) {
                            errorMessage = data.message;
                        }
                    } catch {
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
            if (newPassword.length < 8 || confirmPassword.length < 8) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.error('Password must be at least 8 characters.', {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center',
                    },
                });
                return;
            }

            if (newPassword !== confirmPassword) {
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
                const response = await fetch(`${process.env.REACT_APP_URL}/api/visitors/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ email, newPassword }),
                });

                if (!response.ok) {
                    toast.dismiss();
                    toast.clearWaitingQueue();
                    toast.error('Password could not be reset, contact Admin.', {
                        closeButton: false,
                        autoClose: 2000,
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
                        autoClose: 2000,
                        style: {
                            textAlign: 'center',
                        },
                    });

                    setTimeout(() => {
                        navigate("/FrontendDMS/visitorLogin");
                    }, 2000);
                }
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword((prev) => !prev);
    };

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword((prev) => !prev);
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
                                <label>Email</label>
                                <div className="forgot-password-input-container">
                                    <input
                                        placeholder='Insert Registered Email Address'
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
                        <>
                            <label
                                className="forgot-password-label"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    textAlign: "center",
                                    marginBottom: "30px",
                                    fontWeight: "normal",
                                    fontSize: "15px",
                                    color: "white"
                                }}
                            >
                                An OTP (One-Time Pin) has been sent to your registered email address.
                                <br />Please enter the OTP below to access yout Visitor Profile.
                            </label>

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
                                        {deadlineMs ? (msLeft !== 0 ? `(Expires in ${formatMs(msLeft)})` : "(Expired)") : ''}
                                    </span>
                                </label>
                                <div className="forgot-password-input-container">
                                    <input
                                        type="text"
                                        value={otp}
                                        placeholder='Insert OTP'
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="forgot-password-group">
                                <label className="forgot-password-label">New Password</label>

                                <div className="nl-input-container">
                                    <i><FontAwesomeIcon icon={faLock} /></i>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="Insert new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className={error.length !== 0 ? `nl-surround` : ""}
                                    />
                                    <button
                                        type="button"
                                        className="nl-password-toggle"
                                        onClick={toggleNewPasswordVisibility}
                                    >
                                        <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>
                            <div className="forgot-password-group">
                                <label className="forgot-password-label">Confirm Password</label>

                                <div className="nl-input-container">
                                    <i><FontAwesomeIcon icon={faLock} /></i>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="Insert your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={error.length !== 0 ? `nl-surround` : ""}
                                    />
                                    <button
                                        type="button"
                                        className="nl-password-toggle"
                                        onClick={toggleConfirmPasswordVisibility}
                                    >
                                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                    </button>
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

export default ResetVisitorPassword;
