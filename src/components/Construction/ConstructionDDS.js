import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../ConstructionPage.css';
import { faTools } from '@fortawesome/free-solid-svg-icons';

const ConstructionDDS = () => {
    const navigate = useNavigate();

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-icon-box">
                <img src={`${process.env.PUBLIC_URL}/specialInst.svg`} className={"coming-soon-icon-FA"} />
            </div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-subtitle">This Special Instructions Feature is Currently in Development.</p>
            <p className="coming-soon-footer"><strong>Stay tuned for future updates!</strong></p>
            <button className="notify-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
};

export default ConstructionDDS;