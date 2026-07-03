import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import "./FileInfoHome.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadPopup from "./FileInfo/UploadPopup";
import { faX, faArrowLeft, faSearch, faFileCirclePlus, faCaretLeft, faCaretRight, faGripVertical, faBars, faArrowRight, faUser, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import TopBar from "./Notifications/TopBar";
import ChangePassword from "./UserManagement/ChangePassword";
import { getCurrentUser, can, isAdmin, canIn } from "../utils/auth";
import MigrateOwnership from "./FileInfo/MigrateOwnership";

const FileInfoHome = () => {
    const [error, setError] = useState(null);
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const access = getCurrentUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [upload, setUpload] = useState(false);
    const [batch, setBatch] = useState(false);
    const [reset, setReset] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showDelayedLoading, setShowDelayedLoading] = useState(false);
    const [migrate, setMigrate] = useState(false);

    const toPlural = (type) => {
        const pluralMap = {
            "All Document": "All Documents",
            "DMPR MCOP Guideline": "DMPR MCOP Guidelines",
            "General": "General",
            "Guideline": "Guidelines",
            "Instruction": "Instructions",
            "Log and Register": "Logs and Registers",
            "Manual and User Guide": "Manuals and User Guides",
            "Permit": "Permits",
            "Policy": "Policies",
            "Procedure": "Procedures",
            "Project Management Artifact": "Project Management Artifacts",
            "Report": "Reports",
            "Risk Assessment": "Risk Assessments",
            "Specification": "Specifications",
            "Standard": "Standards",
            "Training and Assessment Document": "Training and Assessment Documents",
            "Work Order": "Work Orders"
        };

        return pluralMap[type] || `${type}s`;
    };

    useEffect(() => {
        let timer;
        if (isLoading) {
            // show overlay only if loading exceeds 400ms
            timer = setTimeout(() => setShowDelayedLoading(true), 400);
        } else {
            setShowDelayedLoading(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading]);

    const clearSearch = () => {
        setSearchQuery("");
    };

    const openUpload = () => {
        setUpload(true);
    };

    const closeUpload = () => {
        setUpload(!upload);
    };

    const openMigrate = () => {
        setMigrate(true);
    };

    const closeMigrate = () => {
        setMigrate(!migrate);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setloggedInUserId(decodedToken.userId);

        }
    }, [navigate]);

    /*
      const iconMap = {
        "All Document": "allDocumentsDMS.svg",
        Audit: "auditsDMSInverted.svg",
        Guideline: "guidelinesDMSInverted.svg",
        "DMPR MCOP Guideline": "guidelinesDMSInverted.svg",
        "Industry Document": "guidelinesDMSInverted.svg",
        MCOP: "guidelinesDMSInverted.svg",
        Policy: "policiesDMSInverted.svg",
        Procedure: "proceduresDMSInverted.svg",
        "Risk Assessment": "riskAssessmentDMSInverted.svg",
        "Special Instruction": "guidelinesDMSInverted.svg",
        Standard: "standardsDMSInverted.svg",
        Training: "guidelinesDMSInverted.svg",
        Permit: "permitsDMSInverted.svg"
      }
    */
    const iconMap = {
        "All Document": "allDocumentsDMS.svg",
    }

    const fetchCount = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/count`, {
                headers: {
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch count');
            }
            const data = await response.json();

            const sortedUsers = data.sort((a, b) => {
                return a._id.localeCompare(b._id);
            });

            setCount(sortedUsers);
            setIsLoading(false);
        } catch (error) {
            setError(error.message);
        } finally {
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchCount();
        }
    }, [loggedInUserId]);

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...count];

    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    const filteredDocs = paddedDocs.filter(file => file && file._id && file._id.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="user-info-container">
            {upload && (<UploadPopup onClose={closeUpload} />)}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Management</p>
                    </div>

                    {false && canIn(access, "DMS", ["systemAdmin", "contributor"]) && (
                        <div className="filter-dm-fi-2">
                            <div className="button-container-dm-fi">
                                <button className="but-dm-fi" onClick={openUpload}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                                        <span className="button-text">Upload Single Document</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {(isAdmin(access) || can(access, "DMS", "systemAdmin")) && (
                        <div className="sidebar-logo-dm-fi">
                            <div className="risk-button-container-create-bot">
                                <button className="but-um" onClick={() => navigate("/FrontendDMS/dmsAdmin")}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faBars} src={"/dmsAdmin.svg"} size="xs" className={"button-logo-custom"} />
                                        <span className="button-text">Manage DMS</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
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
                    {canIn(access, "DMS", ["systemAdmin", "contributor"]) && (
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faFileCirclePlus} title="Upload Single Document" onClick={openUpload} />
                        </div>
                    )}

                    {false && (<div className="burger-menu-icon-um">
                        <span
                            className="fa-layers fa-fw user-migrate-icon"
                            onClick={openMigrate}
                            title="Batch Migrate Documents"
                        >
                            <FontAwesomeIcon icon={faUser} transform="left-7 shrink-3" />
                            <FontAwesomeIcon icon={faUser} transform="right-7 shrink-3" />

                            {/* White outline */}
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                transform="shrink-7 down-1"
                                style={{ color: "white" }}
                            />

                            {/* Arrow */}
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                transform="shrink-8 down-1"
                            />
                        </span>
                    </div>)}
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="info-box-fih">Number of Document Types: {count.length === 0 ? 0 : count.length - 1}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>
                    <TopBar menu={"Admin"} reset={"true"} setReset={setReset} showInfo={true} type={"DMS"} />
                </div>

                <div className="scrollable-box-fi-new-home">
                    {showDelayedLoading && (
                        <div className="file-info-loading" role="status" aria-live="polite" aria-label="Loading">
                            <div className="file-info-loading__spinner" />
                            <div className="file-info-loading__text">Loading Documents</div>
                        </div>
                    )}
                    {!isLoading && filteredDocs.map((doc, index) => (
                        <div key={index} className={`${doc._id === "All Document" ? "document-card-fi-home-all" : "document-card-fi-home"} ${doc ? "" : "empty-card-fi-home"}`} onClick={() => navigate(`/FrontendDMS/documentManage/${doc._id}/new`)}>
                            {doc && (
                                <>
                                    <div className={`${doc._id === "All Document" ? "all-icon-fi-home" : "icon-dept"}`}>
                                        <img src={`${process.env.PUBLIC_URL}/${iconMap[doc._id] || "policiesDMS.svg"}` || `${process.env.PUBLIC_URL}/policiesDMS.svg`} className={`${doc._id === "All Document" ? "all-icon-fi-home" : "icon-dept"}`} />
                                    </div>
                                    <h3 className="document-title-fi-home">
                                        {toPlural(doc._id)}
                                    </h3>
                                    <p className="document-info-fi-home">Documents: {doc.totalCount}</p>
                                    <p className="document-info-fi-home">Reviews Overdue: {doc.overdueCount}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {reset && <ChangePassword onClose={() => setReset(false)} />}
            {migrate && (<MigrateOwnership onClose={closeMigrate} />)}
            <ToastContainer />
        </div>
    );
};

export default FileInfoHome;