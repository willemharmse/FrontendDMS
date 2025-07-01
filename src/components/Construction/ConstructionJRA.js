import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faClipboardList, faScaleBalanced, faTools } from '@fortawesome/free-solid-svg-icons';
import '../ConstructionPage.css';

const ConstructionJRA = () => {
    const navigate = useNavigate();

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-icon-box">
                <FontAwesomeIcon icon={faTools} alt="Clipboard Icon" className="coming-soon-icon-FA" />
            </div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-subtitle">This Published JRA Documents Section is Currently in Development.</p>
            <p className="coming-soon-description">
                The portion of the Risk Development Section is still in development.
            </p>
            <p className="coming-soon-footer"><strong>Stay tuned for future updates!</strong></p>
            <button className="notify-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
};

export default ConstructionJRA;