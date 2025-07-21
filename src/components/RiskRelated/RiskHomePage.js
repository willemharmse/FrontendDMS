import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./RiskHomePage.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faCogs, faHardHat, faListCheck, faNetworkWired, faChevronLeft, faChevronRight, faArrowsRotate, faUserTie, faExclamationTriangle, faTriangleExclamation, faArrowLeft, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

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
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src="CH_Logo.svg" alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>

                    <div className="button-container-rm-home">
                        <button className="but-rm-home" onClick={() => navigate("/FrontendDMS/futureEnhancementRMS")}>
                            <div className="button-content">
                                <span className="button-text">Coming Soon</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-risk">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>

                <div className="scrollable-box-risk-home">
                    <div className={`document-card-riks-all`} onClick={() => navigate("/FrontendDMS/controls")}>
                        <>
                            <div className="icon-risk-all">
                                <img src={`${process.env.PUBLIC_URL}/controlAttributes.svg`} alt="Control Attributes" className="icon-risk-all" />
                            </div>
                            <h3 className="document-title-risk-home">View Controls<br /></h3>
                        </>
                    </div>
                    <div
                        className="document-card-risk-home"
                        onClick={() => navigate("/FrontendDMS/riskBLRA/BLRA")}
                    >
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/blra.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>

                            <h3 className="document-title-risk-home">
                                BLRA<br /><span style={{ fontWeight: "normal", fontSize: "16px" }}>(Using the WRAC Tool)</span>
                            </h3>
                        </>
                    </div>
                    <div
                        className="document-card-risk-home"
                        onClick={() => navigate("/FrontendDMS/riskIBRA/IBRA")}
                    >
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/ibra.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>

                            <h3 className="document-title-risk-home">
                                IBRA<br /><span style={{ fontWeight: "normal", fontSize: "16px" }}>(Using the WRAC Tool)</span>
                            </h3>
                        </>
                    </div>
                    {false &&
                        (<div className={`document-card-risk-home`} onClick={() => navigate("/riskBTA/BTA")}>
                            <>
                                <div className="icon-risk">
                                    <img src="/bta.svg" alt="Control Attributes" className="icon-risk" />
                                </div>
                                <h3 className="document-title-risk-home">IBRA<br /><span style={{ fontWeight: "normal", fontSize: "16px" }}>(Using the BTA tool)</span></h3>
                            </>
                        </div>)}
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/riskJRA/JRA")}>
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/jra.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>
                            <h3 className="document-title-risk-home">JRA<br /></h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default RiskHomePage;