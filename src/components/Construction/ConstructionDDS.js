import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faClipboardList, faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import '../ConstructionPage.css';

const ConstructionDDS = () => {
    const navigate = useNavigate();
    const type = useParams().type;

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-icon-box">
                <FontAwesomeIcon icon={type === "Standard" ? faCertificate : faScaleBalanced} alt="Clipboard Icon" className="coming-soon-icon-FA" />
            </div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-subtitle">This Document Development Feature is Currently in Development.</p>
            <p className="coming-soon-description">
                {type === "Standard" ? "The Standard portion of the Document Development Section is still in development." : "The Policy portion of the Document Development Section is still in development."}
            </p>
            <p className="coming-soon-footer"><strong>Stay tuned for future updates!</strong></p>
            <button className="notify-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
};

export default ConstructionDDS;