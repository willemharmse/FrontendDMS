import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faCaretLeft, faCaretRight
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
        total: 150,
        valid: 100,
        invalid: 20,
        dueForReview: 30,
    };

    return (
        <div className="risk-info-container" style={{ fontFamily: "Arial" }}>
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Dashboards</p>
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
                    <div className={isSidebarVisible ? `dms-ops-grid-sideopen` : `dms-ops-grid`}>
                        {/* 1. Document Management */}
                        <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/dmsDash')}>
                            <div className="dms-ops-card-header">
                                <div style={{ width: "100%" }}>
                                    <p className="dms-ops-card-title">Document Management</p>
                                    <p className="dms-ops-card-desc">Stored and controlled documents</p>
                                </div>
                                <span className="dms-ops-badge dms-ops-badge-warn">Attention Required</span>
                            </div>
                            <div className="dms-ops-bottom">
                                <div className="dms-ops-hero">
                                    <div className="dms-ops-hero-number color-red">{stats.invalid + stats.dueForReview}</div>
                                    <div className="dms-ops-hero-label">Documents Requiring Attention</div>
                                </div>
                                <div className="dms-ops-substats">
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-orange">{stats.dueForReview}</span>
                                        <span className="dms-ops-substat-lbl">Expiring Soon</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-red">{stats.invalid}</span>
                                        <span className="dms-ops-substat-lbl">Expired</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-green">{stats.valid}</span>
                                        <span className="dms-ops-substat-lbl">Valid</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Document Development */}
                        <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/ddsDash')}>
                            <div className="dms-ops-card-header">
                                <div style={{ width: "100%" }}>
                                    <p className="dms-ops-card-title">Document Development</p>
                                    <p className="dms-ops-card-desc">Documents in creation and approval</p>
                                </div>
                                <span className="dms-ops-badge dms-ops-badge-info">Monitor</span>
                            </div>
                            <div className="dms-ops-bottom">
                                <div className="dms-ops-hero">
                                    <div className="dms-ops-hero-number color-blue">202</div>
                                    <div className="dms-ops-hero-label">Documents In Development</div>
                                </div>
                                <div className="dms-ops-substats">
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-orange">90</span>
                                        <span className="dms-ops-substat-lbl">In Approval</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-blue">102</span>
                                        <span className="dms-ops-substat-lbl">In Review</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-green">10</span>
                                        <span className="dms-ops-substat-lbl">Under Periodic Review</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Risk Management */}
                        <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/rmsDash')}>
                            <div className="dms-ops-card-header">
                                <div style={{ width: "100%" }}>
                                    <p className="dms-ops-card-title">Risk Management</p>
                                    <p className="dms-ops-card-desc">Risk assessments and approvals</p>
                                </div>
                                <span className="dms-ops-badge dms-ops-badge-info">Monitor</span>
                            </div>
                            <div className="dms-ops-bottom">
                                <div className="dms-ops-hero">
                                    <div className="dms-ops-hero-number color-blue">202</div>
                                    <div className="dms-ops-hero-label">Risk Assessments In Development</div>
                                </div>
                                <div className="dms-ops-substats">
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-orange">90</span>
                                        <span className="dms-ops-substat-lbl">In Approval</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-blue">102</span>
                                        <span className="dms-ops-substat-lbl">In Review</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-green">10</span>
                                        <span className="dms-ops-substat-lbl">Under Periodic Review</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Training Management */}
                        <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/constructionHelp')}>
                            <div className="dms-ops-card-header">
                                <div style={{ width: "100%" }}>
                                    <p className="dms-ops-card-title">Training Management</p>
                                    <p className="dms-ops-card-desc">Courses and inductions</p>
                                </div>
                                <span className="dms-ops-badge dms-ops-badge-warn">Attention Required</span>
                            </div>
                            <div className="dms-ops-bottom">
                                <div className="dms-ops-hero">
                                    <div className="dms-ops-hero-number color-red">31</div>
                                    <div className="dms-ops-hero-label">Overdue Training</div>
                                </div>
                                <div className="dms-ops-substats">
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-blue">240</span>
                                        <span className="dms-ops-substat-lbl">Allocated Courses</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-blue">18</span>
                                        <span className="dms-ops-substat-lbl">Active Courses</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-green">209</span>
                                        <span className="dms-ops-substat-lbl">Completed Courses</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. EPA Management */}
                        <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/constructionHelp')}>
                            <div className="dms-ops-card-header">
                                <div style={{ width: "100%" }}>
                                    <p className="dms-ops-card-title">EPA Management</p>
                                    <p className="dms-ops-card-desc">Certificate validity tracking</p>
                                </div>
                                <span className="dms-ops-badge dms-ops-badge-danger">High Attention</span>
                            </div>
                            <div className="dms-ops-bottom">
                                <div className="dms-ops-hero">
                                    <div className="dms-ops-hero-number color-red">29</div>
                                    <div className="dms-ops-hero-label">Certificates Requiring Attention</div>
                                </div>
                                <div className="dms-ops-substats">
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-orange">22</span>
                                        <span className="dms-ops-substat-lbl">Expiring Soon</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-red">7</span>
                                        <span className="dms-ops-substat-lbl">Expired</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-green">310</span>
                                        <span className="dms-ops-substat-lbl">Valid</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Compliance Tracking */}
                        <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/constructionHelp')}>
                            <div className="dms-ops-card-header">
                                <div style={{ width: "100%" }}>
                                    <p className="dms-ops-card-title">Compliance Tracking</p>
                                    <p className="dms-ops-card-desc">Tasks, actions and accountability</p>
                                </div>
                                <span className="dms-ops-badge dms-ops-badge-danger">High Attention</span>
                            </div>
                            <div className="dms-ops-bottom">
                                <div className="dms-ops-hero">
                                    <div className="dms-ops-hero-number color-red">12</div>
                                    <div className="dms-ops-hero-label">Overdue</div>
                                </div>
                                <div className="dms-ops-substats">
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-blue">64</span>
                                        <span className="dms-ops-substat-lbl">Open Tasks</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-orange">24</span>
                                        <span className="dms-ops-substat-lbl">Due Soon</span>
                                    </div>
                                    <div className="dms-ops-substat">
                                        <span className="dms-ops-substat-num color-green">180</span>
                                        <span className="dms-ops-substat-lbl">Completed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer />
        </div>
    );
};

export default DMSDashboard;
