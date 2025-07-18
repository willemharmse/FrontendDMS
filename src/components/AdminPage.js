import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import "./AdminPage.css";
import "./FileInfoHome.css"
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadPopup from "./FileInfo/UploadPopup";
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder, faCloudUploadAlt, faUsersCog, faSitemap, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
import BatchUpload from "./FileInfo/BatchUpload";
import {
    faBuilding,
    faBriefcase,
    faUserMd,
    faGraduationCap,
    faGavel,
    faMicrochip,
    faChartLine,
    faFlask,
    faCog,
    faPencilRuler,
    faUsers,
    faBalanceScale,
    faPalette,
    faGlobe,
    faBook,
    faHeadset,
    faHandsHelping,
    faDollarSign,
    faServer,
    faUniversity, faChevronLeft, faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import ImportSiteInfo from "./UploadPage/ImportSiteInfo";
import ImportRiskSiteInfo from "./RiskRelated/ImportRiskSiteInfo";
import TopBar from "./Notifications/TopBar";

const AdminPage = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'developer'];
    const leaderRoles = ['teamleader'];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [upload, setUpload] = useState(false);
    const [batch, setBatch] = useState(false);
    const [importSI, setImportSI] = useState(false);
    const [importRSI, setImportRSI] = useState(false);
    const navigate = useNavigate();

    const clearSearch = () => {
        setSearchQuery("");
    };

    const openUpload = () => {
        setUpload(true);
    };

    const openImportSI = () => {
        setImportSI(true);
    };

    const closeImportSI = () => {
        setImportSI(false);
    };

    const openImportRSI = () => {
        setImportRSI(true);
    };

    const closeImportRSI = () => {
        setImportRSI(false);
    };

    const closeUpload = () => {
        setUpload(!upload);
    };

    const openBatch = () => {
        setBatch(true);
    };

    const closeBatch = () => {
        setBatch(!batch);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            console.log(decodedToken);
            setRole(decodedToken.role);
            setloggedInUserId(decodedToken.userId);
        }
    }, [navigate]);

    const imageMap = {
        "All Document": "All.png",
        Audit: "audit.png",
        Guideline: "guide.png",
        Policy: "policy.png",
        Procedure: "procedure.png",
        Standard: "standard.png",
        "Risk Assessment": "risk.png",
    };

    const image = (type) => {
        return imageMap[type]; // Fallback to "default.png" if type is not found
    };

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...count];

    // Add placeholders if fewer than 12
    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            {upload && (<UploadPopup onClose={closeUpload} />)}
            {batch && (<BatchUpload onClose={closeBatch} />)}
            {importSI && (<ImportSiteInfo onClose={closeImportSI} />)}
            {importRSI && (<ImportRiskSiteInfo onClose={closeImportRSI} />)}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Admin Page</p>
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
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>

                <div className="scrollable-box-fi-home">
                    <div className={`document-card-fi-home`} onClick={openBatch}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/adminBatchUpload.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Upload Batch Documents</h3>
                        </>
                    </div>
                    <div className={`document-card-fi-home`} onClick={openImportSI}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/adminSIDDS.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Import Site General Information</h3>
                        </>
                    </div>
                    <div className={`document-card-fi-home`} onClick={openImportRSI}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/adminSIRMS.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Import Site Risk Information</h3>
                        </>
                    </div>
                    <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/userManagement")}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/adminUsers.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Manage Users</h3>
                        </>
                    </div>
                    <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/departmentManage")}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/adminDepartments.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Manage Departments</h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default AdminPage;