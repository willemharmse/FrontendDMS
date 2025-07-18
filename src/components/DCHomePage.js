import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DCHomePage.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced, faCertificate, faListOl, faChevronLeft, faChevronRight, faArrowLeft, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

import TopBar from "./Notifications/TopBar";

const DCHomePage = () => {
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
        <div className="dc-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Development</p>
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
                    <TopBar role={role} />
                </div>

                <div className="scrollable-box-dc-home">
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/documentCreateProc/Procedure")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/proceduresDMS.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Procedures</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/documentCreateStand/Standard")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/standardsDMS.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Standards</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/constructionDDS")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/specialInst.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Special Instructions *</h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default DCHomePage;