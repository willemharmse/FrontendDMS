import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DCHomePage.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced, faCertificate, faListOl, faChevronLeft, faChevronRight, faArrowLeft, faCaretLeft, faCaretRight, faCircle, faFileAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "./Notifications/TopBarDD";
import TopBar from "./Notifications/TopBar";
import { getCurrentUser, canIn } from "../utils/auth";

const DCHomePage = () => {
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
                        <p className="logo-text-um">Document Development</p>
                    </div>

                    {false && canIn(access, "DDS", ["systemAdmin"]) && (<div className="button-container-rm-home">
                        <button className="but-um" onClick={() => navigate("/ddsAdmin")}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faBars} src={"/dmsAdmin.svg"} size="xs" className={"button-logo-custom"} />
                                <span className="button-text">Manage DDS</span>
                            </div>
                        </button>
                    </div>)}
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
                    <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} showInfo={true} type={"DDS"} showDash={true} />
                </div>

                <div className="scrollable-box-dc-home">
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/procedureHome")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/proceduresDMS.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Procedures</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/standardHome")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/standardsDMS.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Standards</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/specialHome")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/specialInst.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Special Instructions</h3>
                        </>
                    </div>
                    {false && canIn(access, "DDS", ["systemAdmin"]) && (<div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/allDDSDrafts")}>
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/migrate1.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>
                            <h3 className="document-title-risk-home">All System Drafts<br /></h3>
                        </>
                    </div>)}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default DCHomePage;