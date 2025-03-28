import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import './ConstructionPage.css';

const ConstructionTM = () => {
    const navigate = useNavigate();
    return (
        <div className="coming-soon-container">
            <div className="coming-soon-icon-box">
                <img src={"TM.png"} alt="Clipboard Icon" className="coming-soon-icon-TM" />
            </div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-subtitle">This Training Management Feature is Currently in Development.</p>
            <p className="coming-soon-description">
                This feature will streamline training processes by linking training content directly to procedure content,
                standardizing onboarding, and automating training tracking.
            </p>
            <p className="coming-soon-footer"><strong>Stay tuned for future updates!</strong></p>
            <button className="notify-button" onClick={() => navigate("/FrontendDMS/home")}>Back to Home</button>
        </div>
    );
};

export default ConstructionTM;