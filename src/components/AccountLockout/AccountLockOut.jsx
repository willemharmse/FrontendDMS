import React from "react";
import "./AccountLockOut.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const AccountLockOut = ({ toggleLocked }) => {
    return (
        <div className="account-lock-overlay">
            <div className="account-lock-content">
                <div className="account-lock-header">
                    <h2 className="account-lock-title">Account Locked</h2>
                    <button
                        className="account-lock-close"
                        onClick={() => toggleLocked(false)}
                        title="Close Popup"
                    >
                        ×
                    </button>
                </div>

                <div className="account-lock-body">
                    <FontAwesomeIcon icon={faLock} className="account-lock-icon" />
                    <p className="account-lock-helper-text">
                        This account has been temporarily locked due to multiple unsuccessful login attempts.
                        Please use the forgot password feature to reset password.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccountLockOut;
