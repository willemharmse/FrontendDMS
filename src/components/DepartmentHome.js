import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import "./FileInfoHome.css";
import "./DepartmentHome.css"
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadPopup from "./FileInfo/UploadPopup";
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder, faCirclePlus, faCalculator, faTrash } from '@fortawesome/free-solid-svg-icons';
import { icon } from "@fortawesome/fontawesome-svg-core";
import DeparmentList from "./UserManagement/DepartmentList";
import AddDepartmentModal from "./UserManagement/AddDepartmentModal";
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
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
import TopBar from "./Notifications/TopBar";

const DepartmentHome = () => {
    const [error, setError] = useState(null);
    const [deletePopup, setDeletePopup] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [departments, setDepartments] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'developer'];
    const leaderRoles = ['teamleader'];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [create, setCreate] = useState(false);
    const navigate = useNavigate();

    const clearSearch = () => {
        setSearchQuery("");
    };

    const openDelete = () => {
        setDeletePopup(true);
    };

    const closeDelete = () => {
        setDeletePopup(!deletePopup);
        fetchDepartments();
    };

    const openAdd = () => {
        setCreate(true);
    };

    const closeAdd = () => {
        setCreate(!create);
        fetchDepartments();
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

    const iconMap = {
        faSearch: faSearch,
        faCalculator: faCalculator,
        faBuilding: faBuilding, // General Office / Administration
        faBriefcase: faBriefcase, // Business / HR
        faUserMd: faUserMd, // Medical / Healthcare
        faGraduationCap: faGraduationCap, // Education / Training
        faGavel: faGavel, // Legal
        faMicrochip: faMicrochip, // Technology / IT
        faChartLine: faChartLine, // Marketing / Sales
        faFlask: faFlask, // Research / Science
        faCog: faCog, // Engineering / Manufacturing
        faPencilRuler: faPencilRuler, // Design / Architecture
        faUsers: faUsers, // Human Resources
        faBalanceScale: faBalanceScale, // Law / Compliance
        faPalette: faPalette, // Arts / Creative
        faGlobe: faGlobe, // International / Public Relations
        faBook: faBook, // Library / Documentation
        faHeadset: faHeadset, // Customer Support
        faHandsHelping: faHandsHelping, // Social Services / NGO
        faDollarSign: faDollarSign, // Finance / Accounting
        faServer: faServer, // Data / Network Management
        faUniversity: faUniversity // Academic Institution
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch count');
            }
            const data = await response.json();

            const sortedUsers = data.departments.sort((a, b) => {
                // Replace 'name' with the property you want to sort by
                return a.department.localeCompare(b.department);
            });

            setDepartments(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchDepartments();
        }
    }, [loggedInUserId]);

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...departments];

    // Add placeholders if fewer than 12
    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    const filteredDocs = paddedDocs.filter(file => file && file.department && file.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const openModal = () => {
        //setIsModalOpen(true);
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            {deletePopup && (<DeparmentList closePopup={closeDelete} />)}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-dept">Department Management</p>
                    </div>

                    <div className="filter-fih">
                        <div className="button-container-dept">
                            <button className="but-um" onClick={openAdd}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faCirclePlus} className="button-icon" />
                                    <span className="button-text">Create Department</span>
                                </div>
                            </button>
                        </div>
                        <div className="button-container-dept-2">
                            <button className="but-um" onClick={openDelete}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faTrash} className="button-icon" />
                                    <span className="button-text">Delete Department</span>
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

                    <div className="info-box-fih">Number of Departments: {filteredDocs.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>

                <div className="scrollable-box-fi-home">
                    {filteredDocs.map((doc, index) => (
                        <div key={index} className={`document-card-fi-home ${doc ? "" : "empty-card-fi-home"}`} onClick={() => navigate(`/FrontendDMS/department/${doc._id}`)}>
                            {doc && (
                                <>
                                    <div className="icon-dept">
                                        <FontAwesomeIcon icon={iconMap[doc.icon]} className={"icon-dept"} />
                                    </div>
                                    <h3 className="document-title-dept">{doc._id === "Policy" ? "Policie" : doc.department}</h3>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {create && (<AddDepartmentModal show={create} onClose={closeAdd} />)}
            <ToastContainer />
        </div>
    );
};

export default DepartmentHome;