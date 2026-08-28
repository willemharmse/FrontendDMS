import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced, faCertificate, faListOl, faChevronLeft, faChevronRight, faArrowLeft, faCaretLeft, faCaretRight, faCircle, faFileAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { canIn, getCurrentUser } from "../../../utils/auth";
import TopBarDD from "../../Notifications/TopBarDD";

const SpecialHomePage = () => {
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

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/specialInstInverted.svg`} className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Special Instructions"}</p>
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
                    <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} />
                </div>

                <div className="scrollable-box-dc-home">
                    <div className={`document-card-fi-home-all`} onClick={() => navigate("/FrontendDMS/documentCreateSI/Special Instruction/new")}>
                        <>
                            <div className="all-icon-fi-home">
                                <img src={`${process.env.PUBLIC_URL}/specialInstInverted.svg`} className={"all-icon-fi-home"} />
                            </div>
                            <h3 className="document-title-dc-home">Develop Special Instruction</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/documentDevelopmentDrafts/special")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/tmsSavedDrafts.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Saved Drafts</h3>
                        </>
                    </div>
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/generatedSpecialFiles")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Pending Sign Off Special Instructions</h3>
                        </>
                    </div>
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/signedOffSpecial")}>
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>
                            <h3 className="document-title-risk-home">Controlled Special Instructions<br /></h3>
                        </>
                    </div>
                    <div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/documentDevelopmentRevisions/special")}>
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>
                            <h3 className="document-title-risk-home">Under Revision Special Instructions<br /></h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default SpecialHomePage;