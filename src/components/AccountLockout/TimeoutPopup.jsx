import React, { useEffect, useState } from "react";
import "./TimeoutPopup.css";

const TimeoutPopup = ({ closeTimeoutModal, remain, quit }) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    return (
        <div className="timeout-popup-overlay">
            <div className="timeout-popup-content">
                <div className="timeout-file-header">
                    <h2 className="timeout-file-title">Inactivity Detected</h2>
                    <button className="timeout-file-close" onClick={closeTimeoutModal} title="Close Popup">×</button>
                </div>

                <div className="timeout-file-group">
                    <div className="timeout-file-text">You have been inactive for more than 40 minutes, would you like to remain logged onto the application?</div>
                    <div>You will be automatically logged out at {timeString}.</div>
                </div>

                <div className="timeout-file-buttons">
                    <button className="timeout-file-button-download" onClick={remain}>
                        Stay
                    </button>
                    <button className="timeout-file-button-cancel" onClick={quit}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeoutPopup;