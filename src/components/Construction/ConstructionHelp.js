import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faClipboardList, faQuestionCircle, faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import '../ConstructionPage.css';

const ConstructionHelp = () => {
    const navigate = useNavigate();
    const type = useParams().type;

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-icon-box">
                <FontAwesomeIcon icon={faQuestionCircle} alt="Clipboard Icon" className="coming-soon-icon-FA" />
            </div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-subtitle">Feature Under Development.</p>
            <p className="coming-soon-description">
                {"The Help function is still under development."}
            </p>
            <p className="coming-soon-footer"><strong>Stay tuned for future updates!</strong></p>
            <button className="notify-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
};

export default ConstructionHelp;