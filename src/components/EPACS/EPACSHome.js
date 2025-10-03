import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faCertificate, faFile } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import { getCurrentUser, canIn } from "../../utils/auth";
import { hasRole } from "../../utils/auth";

const EPACSHome = () => {
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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
                        <p className="logo-text-um">EPA Management</p>
                    </div>
                    <div className="button-container-rm-home">
                        <button className="but-rm-home" onClick={() => navigate("/FrontendDMS/futureEnhancementEPAC")}>
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
            <div className="main-box-dc">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="scrollable-box-dc-home">
                    {hasRole(access, "FCMS") && (<div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/flameManageSites")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/fmsMainImage.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Flameproof Management</h3>
                        </>
                    </div>)}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default EPACSHome;