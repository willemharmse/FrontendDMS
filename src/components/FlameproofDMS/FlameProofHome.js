import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faArrowLeft, faSearch, faFileCirclePlus, faCaretLeft, faCaretRight, faTruck, faIndustry, faHammer, faDrumSteelpan, faCogs, faTruckMonster, faTractor } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import ChangePassword from "../UserManagement/ChangePassword";
import { getCurrentUser, can, isAdmin, canIn } from "../../utils/auth";

const FlameProofHome = () => {
    const [error, setError] = useState(null);
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const access = getCurrentUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [upload, setUpload] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const clearSearch = () => {
        setSearchQuery("");
    };

    const openUpload = () => {
        setUpload(true);
    };

    const closeUpload = () => {
        setUpload(!upload);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setloggedInUserId(decodedToken.userId);

        }
    }, [navigate]);

    const iconMap = {
        "All Document": "allDocumentsDMS.svg",
        Audit: "auditsDMS.svg",
        Guideline: "guidelinesDMS.svg",
        "DMRE MCOP Guideline": "guidelinesDMS.svg",
        "Industry Document": "guidelinesDMS.svg",
        MCOP: "guidelinesDMS.svg",
        Policy: "policiesDMS.svg",
        Procedure: "proceduresDMS.svg",
        "Risk Assessment": "riskAssessmentDMS.svg",
        "Special Instruction": "guidelinesDMS.svg",
        Standard: "standardsDMS.svg",
        Training: "guidelinesDMS.svg",
        Permit: "permitsDMS.svg"
    }

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Flameproof Compliance Management</p>
                    </div>

                    <div className="filter-fih">
                        <p className="filter-text-um">Upload</p>
                        <div className="button-container-fih">
                            <button className="but-um">
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                                    <span className="button-text">Single Certificate</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <div className="risk-button-container-create-bot">
                            <button className="but-um">
                                <div className="button-content">
                                    <img src={`${process.env.PUBLIC_URL}/dmsAdmin.svg`} className={"button-logo-custom"} />
                                    <span className="button-text">Manage FCMS</span>
                                </div>
                            </button>
                        </div>
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

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="info-box-fih">Number of Certificate Types: 6</div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="scrollable-box-fi-home">
                    <div className={`document-card-fi-home-all`} onClick={() => navigate(`/FrontendDMS/flameManage/All Document`)}>
                        <>
                            <div className={`all-icon-fi-home`}>
                                <img src={`${process.env.PUBLIC_URL}/allDocumentsDMS.svg`} className="all-icon-fi-home" />
                            </div>
                            <h3 className="document-title-fi-home">All Site A Assets</h3>
                            <p className="document-info-fi-home">Certificates: 0</p>
                            <p className="document-info-fi-home">Invalid Certificates: 0</p>
                        </>
                    </div>

                    <div className={`document-card-fi-home`} onClick={() => navigate(`/FrontendDMS/flameManage/Continuous Miners (CM)`)}>
                        <>
                            <div className={`icon-dept`}>
                            </div>
                            <h3 className="document-title-fi-home">Continuous Miners (CM)</h3>
                            <p className="document-info-fi-home">Certificates: 0</p>
                            <p className="document-info-fi-home">Invalid Certificates: 0</p>
                        </>
                    </div>

                    <div className={`document-card-fi-home`}>
                        <>
                            <div className={`icon-dept`}>
                            </div>
                            <h3 className="document-title-fi-home">Shuttle Cars (SC)</h3>
                            <p className="document-info-fi-home">Certificates: 0</p>
                            <p className="document-info-fi-home">Invalid Certificates: 0</p>
                        </>
                    </div>

                    <div className={`document-card-fi-home`}>
                        <>
                            <div className={`icon-dept`}>
                            </div>
                            <h3 className="document-title-fi-home">Roof Bolters (RB)</h3>
                            <p className="document-info-fi-home">Certificates: 0</p>
                            <p className="document-info-fi-home">Invalid Certificates: 0</p>
                        </>
                    </div>

                    <div className={`document-card-fi-home`}>
                        <>
                            <div className={`icon-dept`}>
                            </div>
                            <h3 className="document-title-fi-home">Feeder Breakers (FB)</h3>
                            <p className="document-info-fi-home">Certificates: 0</p>
                            <p className="document-info-fi-home">Invalid Certificates: 0</p>
                        </>
                    </div>

                    <div className={`document-card-fi-home`}>
                        <>
                            <div className={`icon-dept`}>
                            </div>
                            <h3 className="document-title-fi-home">Load Haul Dumps (LHD)</h3>
                            <p className="document-info-fi-home">Certificates: 0</p>
                            <p className="document-info-fi-home">Invalid Certificates: 0</p>
                        </>
                    </div>

                    <div className={`document-card-fi-home`}>
                        <>
                            <div className={`icon-dept`}>
                            </div>
                            <h3 className="document-title-fi-home">Tractors (T)</h3>
                            <p className="document-info-fi-home">Certificates: 0</p>
                            <p className="document-info-fi-home">Invalid Certificates: 0</p>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default FlameProofHome;