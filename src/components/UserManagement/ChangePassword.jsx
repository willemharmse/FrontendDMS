import React, { useState } from "react";
import "./ChangePassword.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';

const ChangePassword = ({ onClose }) => {
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [newPass2, setNewPass2] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [showPasswordCurr, setShowPasswordCurr] = useState(false);
    const [showPasswordNew, setShowPasswordNew] = useState(false);
    const [showPasswordNew2, setShowPasswordNew2] = useState(false);

    const togglePasswordVisibilityNew = () => {
        setShowPasswordNew((prev) => !prev);
    };

    const togglePasswordVisibilityCurr = () => {
        setShowPasswordCurr((prev) => !prev);
    };

    const togglePasswordVisibilityNew2 = () => {
        setShowPasswordNew2((prev) => !prev);
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!currentPass.trim() || !newPass.trim() || !newPass2.trim()) {
            setLoading(false);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please enter all values.", {
                closeButton: false,
                autoClose: 1000, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (newPass.trim().length < 8) {
            setLoading(false);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Ensure that the new password has more than 8 characters.", {
                closeButton: false,
                autoClose: 1000, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (newPass.trim() != newPass2.trim()) {
            setLoading(false);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Ensure that the new passwords match.", {
                closeButton: false,
                autoClose: 1000, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/resetPassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    currentPass: currentPass.trim(),
                    newPass: newPass.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setLoading(false);
                setMessage({ text: data.message, type: "error" });
                return;
            }

            setLoading(false);
            setMessage({ text: "Password changed successfully!", type: "success" });

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            setMessage({ text: "Failed to change password.", type: "error" });
        }
    };

    const handleClose = () => {
        setCurrentPass("");
        setNewPass("");
        setNewPass2("");
        setLoading(false);
        setMessage({ text: "", type: "" });
        localStorage.setItem('firstLogin', 'false');
        onClose();
    };

    return (
        <div className="password-reset-popup-overlay">
            <div className="password-reset-popup-content">
                <div className="password-reset-popup-header">
                    <h2 className="password-reset-popup-title">Change Password</h2>
                    <button className="password-reset-close" onClick={onClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="password-reset-popup-group">
                        <label className="password-reset-popup-label">Enter Current Password:</label>
                        <div className="password-reset-input-container">
                            <input
                                spellcheck="true"
                                type={showPasswordCurr ? 'text' : 'password'}
                                value={currentPass}
                                onChange={(e) => setCurrentPass(e.target.value)}
                                className="password-reset-popup-input"
                                required
                                placeholder="Current Password"
                            />
                            <button
                                type="button"
                                className="password-reset-password-toggle"
                                onClick={togglePasswordVisibilityCurr}
                            >
                                <FontAwesomeIcon icon={showPasswordCurr ? faEyeSlash : faEye} title="Show/Hide Password" />
                            </button>
                        </div>
                    </div>

                    <div className="password-reset-popup-group">
                        <label className="password-reset-popup-label">Enter New Password:</label>
                        <div className="password-reset-input-container">
                            <input
                                spellcheck="true"
                                type={showPasswordNew ? 'text' : 'password'}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                className="password-reset-popup-input"
                                required
                                placeholder="New Password"
                            />
                            <button
                                type="button"
                                className="password-reset-password-toggle"
                                onClick={togglePasswordVisibilityNew}
                            >
                                <FontAwesomeIcon icon={showPasswordNew ? faEyeSlash : faEye} title="Show/Hide Password" />
                            </button>
                        </div>
                    </div>

                    <div className="password-reset-popup-group">
                        <label className="password-reset-popup-label">Retype New Password:</label>
                        <div className="password-reset-input-container">
                            <input
                                spellcheck="true"
                                type={showPasswordNew2 ? 'text' : 'password'}
                                value={newPass2}
                                onChange={(e) => setNewPass2(e.target.value)}
                                className="password-reset-popup-input"
                                required
                                placeholder="Retype New Password"
                            />
                            <button
                                type="button"
                                className="password-reset-password-toggle"
                                onClick={togglePasswordVisibilityNew2}
                            >
                                <FontAwesomeIcon icon={showPasswordNew2 ? faEyeSlash : faEye} title="Show/Hide Password" />
                            </button>
                        </div>
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`password-reset-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="password-reset-popup-buttons">
                        <button type="submit" className="password-reset-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Change'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;