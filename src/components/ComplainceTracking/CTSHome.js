import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced, faCertificate, faListOl, faChevronLeft, faChevronRight, faArrowLeft, faCaretLeft, faCaretRight, faCircle, faFileAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import { getCurrentUser, canIn } from "../../utils/auth";

const CTSHome = () => {
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const access = getCurrentUser();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    return (
        <div className="dc-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Compliance Tracking</p>
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
            <div className="main-box-dc">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar showInfo={true} type={"CTS"} training={false} />
                </div>

                <div className="scrollable-box-dc-home">
                    <div className={`document-card-fi-home-all`} onClick={() => navigate("/FrontendDMS/taskTemplates")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/templateManagement1.svg`} className={"all-icon-fi-home"} />
                            </div>
                            <h3 className="document-title-dc-home">Manage Templates</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/manualTaskingPage")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/taskManagement1.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Task Management</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/mainDash")}>
                        <>
                            <div className="icon-dc">
                                <FontAwesomeIcon icon={faCircle} style={{ color: "#002060" }} src={`${process.env.PUBLIC_URL}/standardsDMS.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Dashboards</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/workManagement")}>
                        <>
                            <div className="icon-dc">
                                <FontAwesomeIcon icon={faCircle} style={{ color: "#002060" }} src={"/standardsDMS.svg"} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Work Order Management</h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default CTSHome;