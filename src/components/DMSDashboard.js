import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faCaretLeft, faCaretRight,
    faFileAlt, faFileCircleCheck, faFileCircleXmark, faClock
} from '@fortawesome/free-solid-svg-icons';
import TopBar from "./Notifications/TopBar";
import TopBarDD from "./Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../utils/auth";
import "./DMSDashboard.css";

const DMSDashboard = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    // Replace these with real data props or API calls as needed
    const stats = {
        total: 10,
        valid: 7,
        invalid: 10,
        dueForReview: 10,
    };

    return (
        <div className="risk-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src="CH_Logo.svg" alt="Logo" className="logo-img-um" onClick={() => navigate('/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
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
                    <div className="spacer"></div>
                    <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} risk={true} showInfo={true} type={"RMS"} />
                </div>

                <div className="dms-dashboard-wrapper">
                    <p className="dms-section-title">Document Management System Overview</p>

                    <div className="dms-stats-grid">

                        {/* Total Documents */}
                        <div className="dms-stat-card dms-stat-neutral">
                            <div className="dms-stat-icon-circle">
                                <FontAwesomeIcon icon={faFileAlt} />
                            </div>
                            <div className="dms-stat-text">
                                <span className="dms-stat-number">{stats.total}</span>
                                <span className="dms-stat-label">Total Documents</span>
                            </div>
                            <div className="dms-stat-dot"></div>
                        </div>

                        {/* Valid Documents */}
                        <div className="dms-stat-card dms-stat-success">
                            <div className="dms-stat-icon-circle">
                                <FontAwesomeIcon icon={faFileCircleCheck} />
                            </div>
                            <div className="dms-stat-text">
                                <span className="dms-stat-number">{stats.valid}</span>
                                <span className="dms-stat-label">Valid Documents</span>
                            </div>
                            <div className="dms-stat-dot"></div>
                        </div>

                        {/* Invalid Documents */}
                        <div className="dms-stat-card dms-stat-danger">
                            <div className="dms-stat-icon-circle">
                                <FontAwesomeIcon icon={faFileCircleXmark} />
                            </div>
                            <div className="dms-stat-text">
                                <span className="dms-stat-number">{stats.invalid}</span>
                                <span className="dms-stat-label">Invalid Documents</span>
                            </div>
                            <div className="dms-stat-dot"></div>
                        </div>

                        {/* Due for Review */}
                        <div className="dms-stat-card dms-stat-warn">
                            <div className="dms-stat-icon-circle">
                                <FontAwesomeIcon icon={faClock} />
                            </div>
                            <div className="dms-stat-text">
                                <span className="dms-stat-number">{stats.dueForReview}</span>
                                <span className="dms-stat-label">
                                    Due for Review
                                    <span className="dms-stat-sublabel"> (next 30 days)</span>
                                </span>
                            </div>
                            <div className="dms-stat-dot"></div>
                        </div>

                    </div>
                </div>
            </div>

            <ToastContainer />
        </div>
    );
};

export default DMSDashboard;
