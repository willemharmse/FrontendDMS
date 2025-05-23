import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./RiskHomePage.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faCogs, faHardHat, faListCheck, faNetworkWired, faChevronLeft, faChevronRight, faArrowsRotate, faUserTie, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import TopBar from "../Notifications/TopBar";

const RiskHomePage = () => {
    const [role, setRole] = useState('');
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
        }
    }, [navigate]);

    return (
        <div className="risk-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-floating-toggle" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                    <FontAwesomeIcon icon={faChevronRight} />
                </div>
            )}

            <div className="main-box-risk">
                <div className="top-section-um">
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>

                <div className="scrollable-box-risk-home">
                    <div className={`document-card-riks-all`} onClick={() => navigate("/FrontendDMS/controls")}>
                        <>
                            <div className="icon-risk-all">
                                <FontAwesomeIcon icon={faArrowsRotate} className={"icon-risk-all"} />
                            </div>
                            <h3 className="document-title-risk-home">Control Management</h3>
                        </>
                    </div>
                    <div
                        className="document-card-risk-home"
                        onClick={() => navigate("/FrontendDMS/risk/IBRA")}
                    >
                        <>
                            <div className="icon-risk">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="icon-risk" />
                            </div>

                            <h3 className="document-title-risk-home" style={{ marginBottom: "5px" }}>
                                Create New Issue Based Risk Assessment (IBRA)
                                <span
                                    style={{
                                        display: 'block',
                                        marginTop: '4px',
                                        fontSize: '0.85rem',
                                        opacity: 0.8,
                                        fontWeight: 'normal'
                                    }}
                                >
                                    Using the Workplace Risk Assessment and Control (WRAC) Tool
                                </span>
                            </h3>
                        </>
                    </div>
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/risk/JRA")}>
                        <>
                            <div className="icon-risk">
                                <FontAwesomeIcon icon={faHardHat} className={"icon-risk"} />
                            </div>
                            <h3 className="document-title-risk-home">Create New Job Risk Assessment (JRA)</h3>
                        </>
                    </div>
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/constructionRMS/Bowtie")}>
                        <>
                            <div className="icon-risk">
                                <FontAwesomeIcon icon={faUserTie} className={"icon-risk"} />
                            </div>
                            <h3 className="document-title-risk-home">Create New Bowtie Risk Assessment (BTA)</h3>
                        </>
                    </div>


                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default RiskHomePage;