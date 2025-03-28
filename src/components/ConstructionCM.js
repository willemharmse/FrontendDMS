import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import './ConstructionPage.css';

const ConstructionCM = () => {
    const navigate = useNavigate();
    return (
        <div className="coming-soon-container">
            <div className="coming-soon-icon-box">
                <img src={"CM.png"} alt="Clipboard Icon" className="coming-soon-icon" />
            </div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-subtitle">This Compliance Management Feature is Currently in Development.</p>
            <p className="coming-soon-description">
                This Compliance Management tool will enhance audit efficiency and regulatory adherence. It will allow users to extract and organize compliance data quickly, track historical records, and generate audit-ready reports.

            </p>
            <p className="coming-soon-footer"><strong>Stay tuned for future updates!</strong></p>

            <button className="notify-button" onClick={() => navigate("/FrontendDMS/home")}>Back to Home</button>
        </div>
    );
};

export default ConstructionCM;