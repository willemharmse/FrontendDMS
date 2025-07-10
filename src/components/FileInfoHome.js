import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import "./FileInfoHome.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadPopup from "./FileInfo/UploadPopup";
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder, faChevronLeft, faChevronRight, faArrowCircleRight, faArrowsRotate, faClipboardCheck, faBookOpen, faBook, faFileAlt, faHardHat, faScaleBalanced, faDiagramProject, faListCheck, faListOl, faTriangleExclamation, faFileSignature, faCertificate, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
import BatchUpload from "./FileInfo/BatchUpload";
import TopBar from "./Notifications/TopBar";
import ChangePassword from "./UserManagement/ChangePassword";

const FileInfoHome = () => {
    const [error, setError] = useState(null);
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
    const [reset, setReset] = useState(false);
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

    const openBatch = () => {
        setBatch(true);
    };

    const closeBatch = () => {
        setBatch(!batch);
    };


    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/FrontendDMS/');
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

    const icon = (type) => {
        return iconMap[type] || "guide.png"; // Fallback to "default.png" if type is not found
    };

    const fetchCount = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/count`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch count');
            }
            const data = await response.json();

            const sortedUsers = data.sort((a, b) => {
                // Replace 'name' with the property you want to sort by
                return a._id.localeCompare(b._id);
            });

            setCount(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchCount();
        }
    }, [loggedInUserId]);

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...count];

    // Add placeholders if fewer than 12
    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    const filteredDocs = paddedDocs.filter(file => file && file._id && file._id.toLowerCase().includes(searchQuery.toLowerCase()));

    const openModal = () => {
        //setIsModalOpen(true);
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            {upload && (<UploadPopup onClose={closeUpload} />)}
            {batch && (<BatchUpload onClose={closeBatch} />)}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Management</p>
                    </div>

                    <div className="filter-fih">
                        <p className="filter-text-um">Upload</p>
                        <div className="button-container-fih">
                            <button className="but-um" onClick={openUpload}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                                    <span className="button-text">Single Document</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-floating-toggle" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                    <FontAwesomeIcon icon={faChevronRight} />
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

                    <div className="info-box-fih">Number of Document Types: {count.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} menu={"Admin"} reset={"true"} setReset={setReset} />
                </div>

                <div className="scrollable-box-fi-home">
                    {filteredDocs.map((doc, index) => (
                        <div key={index} className={`${doc._id === "All Document" ? "document-card-fi-home-all" : "document-card-fi-home"} ${doc ? "" : "empty-card-fi-home"}`} onClick={() => navigate(`/FrontendDMS/documentManage/${doc._id}`)}>
                            {doc && (
                                <>
                                    <div className={`${doc._id === "All Document" ? "all-icon-fi-home" : "icon-dept"}`}>
                                        <img src={`${process.env.PUBLIC_URL}/${iconMap[doc._id]}`} className={`${doc._id === "All Document" ? "all-icon-fi-home" : "icon-dept"}`} />
                                    </div>
                                    <h3 className="document-title-fi-home">{doc._id === "Policy" ? "Policie" : doc._id}s</h3>
                                    <p className="document-info-fi-home">Documents: {doc.totalCount}</p>
                                    <p className="document-info-fi-home">Reviews Overdue: {doc.overdueCount}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {reset && <ChangePassword onClose={() => setReset(false)} />}
            <ToastContainer />
        </div>
    );
};

export default FileInfoHome;