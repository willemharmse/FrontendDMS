import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import "./FileInfoHome.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadPopup from "./FileInfo/UploadPopup";
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder } from '@fortawesome/free-solid-svg-icons';
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";

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
    const navigate = useNavigate();

    const clearSearch = () => {
        setSearchQuery("");
    };

    const openUpload = () => {
        setUpload(true);
    };

    const closeUpload = () => {
        setUpload(!upload);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
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
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src="CH_Logo.png" alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} />
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
                        <button className="but-um" onClick={() => navigate("/FrontendDMS/batchUpload")}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-icon" />
                                <span className="button-text">Batch Documents</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="info-box-fih">Number of Document Types: {count.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container">
                        {adminRoles.includes(role) && (
                            <div className="burger-menu-icon-um">
                                <FontAwesomeIcon onClick={() => navigate('/FrontendDMS/home')} icon={faArrowLeft} />
                            </div>
                        )}
                        {adminRoles.includes(role) && (
                            <div className="burger-menu-icon-um">
                                <FontAwesomeIcon icon={faBell} />
                            </div>
                        )}
                        {adminRoles.includes(role) && (
                            <div className="burger-menu-icon-um">
                                <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} />
                            </div>
                        )}
                        {isMenuOpen && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
                    </div>
                </div>

                <div className="scrollable-box-fi-home">
                    {filteredDocs.map((doc, index) => (
                        <div key={index} className={`${doc._id === "All Document" ? "document-card-fi-home-all" : "document-card-fi-home"} ${doc ? "" : "empty-card-fi-home"}`} onClick={() => navigate(`/FrontendDMS/documentManage/${doc._id}`)}>
                            {doc && (
                                <>
                                    <div className="document-icon-fi-home"><img src={image(doc._id)} className={`${doc._id === "All Document" ? "icon-fi-home-all" : "icon-fi-home"}`} /></div>
                                    <h3 className="document-title-fi-home">{doc._id === "Policy" ? "Policie" : doc._id}s</h3>
                                    <p className="document-info-fi-home">Documents: {doc.totalCount}</p>
                                    <p className="document-info-fi-home">Reviews Overdue: {doc.overdueCount}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default FileInfoHome;