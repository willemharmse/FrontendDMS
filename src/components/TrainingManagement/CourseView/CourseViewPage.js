import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faEdit, faCaretLeft, faCaretRight, faFolderOpen, faArrowUp, faClipboard, faListDots, faBookOpen, faInfoCircle, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import BurgerMenuFI from "../../FileInfo/BurgerMenuFI";
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import "./CourseViewPage.css";
import TopBar from "../../Notifications/TopBar";

const CourseViewPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [userID, setUserID] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [comment, setComment] = useState("");
    const [showAbbreviationPopup, setShowAbbreviationPopup] = useState(false);
    const [showTermPopup, setShowTermPopup] = useState(false);
    const [selectedData, setSelectedData] = useState("");
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        // Load from sessionStorage on mount
        const cached = sessionStorage.getItem('profilePic');
        setProfilePic(cached || null);
    }, []);

    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
            setUserID(decodedToken.userId);

            if (!adminRoles.includes(decodedToken.role)) {
                navigate("/403");
            }
        }
    }, [navigate]);

    return (
        <div className="risk-admin-draft-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="button-container-create">
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon
                                    icon={faClipboardList}
                                    className="button-icon"
                                />
                                <span className="button-text">Course Outline</span>
                            </div>
                        </button>
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon icon={faInfoCircle} className="button-icon" />
                                <span className="button-text">Introduction</span>
                            </div>
                        </button>
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon
                                    icon={faBookOpen}
                                    className="button-icon"
                                />
                                <span className="button-text">Course Material</span>
                            </div>
                        </button>
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-icon" />
                                <span className="button-text">Resources</span>
                            </div>
                        </button>
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon
                                    icon={faClipboardList}
                                    className="button-icon"
                                />
                                <span className="button-text">Course Recap</span>
                            </div>
                        </button>
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon icon={faClipboard} className="button-icon" />
                                <span className="button-text">Assessment</span>
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
            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="course-view-box">
                    <div className="course-view-content">
                        <div className="course-view-title">
                            Course Title
                        </div>

                        <div className="course-content-body">
                        </div>

                        <div className="course-nav-bar">
                            <button className="course-nav-button back">
                                <FontAwesomeIcon icon={faChevronLeft} /> Back
                            </button>
                            <button className="course-nav-button next">
                                Next <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseViewPage;
