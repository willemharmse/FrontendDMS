import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./CourseHome.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faCirclePlus, faCalculator, faTrash, faCaretLeft, faCaretRight, faBookOpen, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import TeamTable from "../UserManagement/TeamTable";
import TopBar from "../Notifications/TopBar";
import CourseTable from "./CourseTable";

const CourseHome = () => {
    const { deptId } = useParams();
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [formError, setFormError] = useState('');
    const [searchQuery, setSearchQuery] = useState("");
    const [addMembersPopup, setAddMembersPopup] = useState(false);
    const navigate = useNavigate();

    const courses = [
        { courseCode: "C001", courseName: "This is the Course Name", department: "Department", completion: "0 - 30%", author: "Anzel Swanepoel", reviewDate: "2025-02-28" },
        { courseCode: "C002", courseName: "This is the Course Name", department: "Department", completion: "31 - 60%", author: "Anzel Swanepoel", reviewDate: "2025-03-14" },
        { courseCode: "C003", courseName: "This is the Course Name", department: "Department", completion: "61 - 99%", author: "Anzel Swanepoel", reviewDate: "2025-03-14" },
        { courseCode: "C004", courseName: "This is the Course Name", department: "Department", completion: "100%", author: "Anzel Swanepoel", reviewDate: "2025-03-28" },
        { courseCode: "C005", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-07" },
        { courseCode: "C006", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C007", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C008", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C009", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C010", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C011", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C012", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C013", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C014", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C015", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C011", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C012", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C013", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
        { courseCode: "C014", courseName: "This is the Course Name", department: "Department", completion: "", author: "Anzel Swanepoel", reviewDate: "2025-05-31" },
    ];


    const clearSearch = () => {
        setSearchQuery("");
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setloggedInUserId(decodedToken.userId);
        }
    }, [navigate]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src="/CH_Logo.svg" alt="Logo" className="logo-img-um" onClick={() => navigate('/home')} title="Home" />
                        <p className="logo-text-dept">Admin Page</p>
                    </div>

                    <div className="filter-fih">
                        <div className="button-container-dept">
                            <button className="but-um">
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                                    <span className="button-text">New Course</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`/tmsAdminAllCourses.svg`} alt="Logo" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"All Courses"}</p>
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

                    <div className="info-box-um">Number of Users: {courses.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>

                <CourseTable filteredCourses={courses} />
            </div>
            <ToastContainer />
        </div>
    );
};

export default CourseHome;