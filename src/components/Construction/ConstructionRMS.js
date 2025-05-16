import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faCogs, faHardHat, faNetworkWired } from '@fortawesome/free-solid-svg-icons';
import '../ConstructionPage.css';

const ConstructionRMS = () => {
    const icon = (type) => {
        switch (type) {
            case "JRA":
                return faHardHat;
            case "ControlManagement":
                return faCogs;
            default:
                return faNetworkWired;
        }
    };

    const navigate = useNavigate();
    const type = useParams().type;

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-icon-box">
                <FontAwesomeIcon icon={icon(type)} alt="Clipboard Icon" className="coming-soon-icon-FA" />
            </div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-subtitle">This Risk Management Feature is Currently in Development.</p>
            {type !== "ControlManagement" && (
                <p className="coming-soon-description">
                    {type === "JRA" ? "The JRA portion of the Risk Management Section is still in development." : "The Bowtie portion of the Risk Management Section is still in development."}
                </p>
            )}

            {type === "ControlManagement" && (
                <p className="coming-soon-description">
                    The Contol Management portion of the Risk Management Section is still in development.
                </p>
            )}
            <p className="coming-soon-footer"><strong>Stay tuned for future updates!</strong></p>
            <button className="notify-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
};

export default ConstructionRMS;