import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faEye, faEyeSlash, faWifi, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';

const MFAOtpPage = ({ username, deviceId, setOtpCompleted, resendOTP }) => {
    const [id, setId] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [deadlineMs, setDeadlineMs] = useState(null);
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        setDeadlineMs(Date.now() + 10 * 60 * 1000);
    }, []);

    useEffect(() => {
        if (!deadlineMs) return;
        setNowMs(Date.now());
        const id = setInterval(() => setNowMs(Date.now()), 1000); // 1s is plenty
        return () => clearInterval(id);
    }, [deadlineMs]);

    const msLeft = Math.max(0, (deadlineMs ?? 0) - nowMs);
    const formatMs = (ms) => {
        const totalSec = Math.ceil(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/user/verify-mfa`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: id, deviceId, username }),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(data?.message || 'OTP verification failed');
                return;
            }

            if (!data.token) {
                toast.error('No token returned from server');
                return;
            }

            setOtpCompleted(data.token, data.firstLogin);
        } catch (err) {
            setError(err.message || 'Something went wrong');
            setTimeout(() => setError(''), 3000);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleResendOTP = async () => {
        try {
            await resendOTP();
            setDeadlineMs(Date.now() + 15 * 60 * 1000);
        } catch (err) {
        }
    }

    return (
        <div className='type-selector-overlay'>
            <div className="nl-login-container-otp">
                <div className="nl-login-card">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} className='nl-logo-img' />
                    <div className="nl-login-title" style={{ marginBottom: "20px" }}>ComplianceHub{"\u2122"}</div>
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
                        An code has been sent to your registered email address.
                        <br />Please insert it below to ensure this device is treated as a trusted device.
                    </label>
                    <form onSubmit={handleSubmit}>
                        <div className="nl-form-group">
                            <div className="nl-input-container">
                                <i><FontAwesomeIcon icon={faLock} /></i>
                                <input
                                    type="text"
                                    id="id"
                                    placeholder="Insert your OTP"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    required
                                    className={error.length !== 0 ? `nl-surround` : ""}
                                />
                            </div>
                        </div>

                        <div className="nl-options-row" style={{ marginBottom: "0px" }}>
                            <a onClick={handleResendOTP} className="nl-forgot-password-visitor">{msLeft === 0 ? `Resend` : ""}</a>
                            <label
                                className="forgot-password-label"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <span style={{ fontWeight: 500, color: "white" }}>
                                    {deadlineMs ? (msLeft !== 0 ? `(Expires in ${formatMs(msLeft)})` : "(Expired)") : '(Expired)'}
                                </span>
                            </label>
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
        </div>
    );
};

export default MFAOtpPage;
