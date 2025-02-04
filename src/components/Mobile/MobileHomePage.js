import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faFileCircleCheck, faFileCirclePlus, faFile, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import "./MobileHomePage.css";

const MobileHomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="mobile-home-container">
            <header className="mobile-header">
                <div className="mobile-header-content">
                    <img src="logo.webp" alt="Logo" className="mobile-header-logo" />
                    <h1 className="mobile-header-title">TAU5 COMPLIANCE SYSTEM</h1>
                </div>
            </header>

            <div className="mobile-content-sections">
                <div className="mobile-card" onClick={() => navigate("/FrontendDMS/mobileFI")}>
                    <FontAwesomeIcon icon={faFile} className="mobile-logo" />
                    <h3>DOCUMENT MANAGEMENT</h3>
                </div>

                <div className="mobile-card" onClick={() => navigate("/FrontendDMS/documentCreate")}>
                    <FontAwesomeIcon icon={faFileCirclePlus} className="mobile-logo" />
                    <h3>DOCUMENT DEVELOPMENT</h3>
                </div>

                <div className="mobile-card" onClick={() => navigate("/FrontendDMS/riks")}>
                    <FontAwesomeIcon icon={faTriangleExclamation} className="mobile-logo" />
                    <h3>RISK ASSESSMENT</h3>
                </div>

                <div className="mobile-card" onClick={() => navigate("/FrontendDMS/compliance-governance")}>
                    <FontAwesomeIcon icon={faFileCircleCheck} className="mobile-logo" />
                    <h3>COMPLIANCE GOVERNANCE</h3>
                </div>

                <div className="mobile-card" onClick={() => navigate("/FrontendDMS/training-management")}>
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="mobile-logo" />
                    <h3>TRAINING MANAGEMENT</h3>
                </div>
            </div>

            <button className="mobile-logout-button" onClick={() => navigate("/FrontendDMS/mobileLogin")}>
                Logout
            </button>
        </div>
    );
};

export default MobileHomePage;
