import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faTrash, faBookOpen, faAward, faBook, faCertificate } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./UserHomePageTMS.css";
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../../Notifications/TopBar";
import { canIn, getCurrentUser } from "../../../utils/auth";

const VisitorInductionHomePage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const access = getCurrentUser();
    const [viewFilter, setViewFilter] = useState("View");
    const [sortAsc, setSortAsc] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [courses, setCourses] = useState([]);

    const fetchUser = async () => {
        const route = `/api/visitors/visitorInfo/`;
        try {
            const token = sessionStorage.getItem("visitorToken");
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            console.log(data.user);
            setUser(data.user);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchCourses = async () => {
        const route = `/api/visitorDrafts/getCourses/`;
        try {
            const token = sessionStorage.getItem("visitorToken");
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            setCourses(data);
            console.log(data);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchUser(); fetchCourses();
    }, [])

    const getVisitorName = () => {
        return user?.name;
    }

    // rename + fix
    const getVisitorInitials = () => {
        const f = user?.name?.[0]?.toUpperCase() ?? "";
        const l = user?.surname?.[0]?.toUpperCase() ?? "";
        return (f + l) || "??";
    };

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [userID, setUserID] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const renderProgress = (status) => {
        const lower = status.toLowerCase();
        const match = lower.match(/(\d+)\s*%/);
        const percent = match ? Math.min(100, Math.max(0, parseInt(match[1], 10))) : 0;

        // defaults
        let label = `In Progress ${percent}%`;
        let fill = "#FFFF89";  // yellow-ish (progress)
        let cls = "course-home-info-progress-badge";

        if (lower.includes("completed")) {
            label = "Completed 100%";
            cls += " is-complete";
            return (
                <div className="course-home-info-progress-wrap">
                    <div className={cls} style={{ "--p": "100%", "--fill": "#7EAC89" }}>
                        <span className="label-course-info">{label}</span>
                    </div>
                </div>
            );
        }

        if (lower.includes("in progress")) {
            return (
                <div className="course-home-info-progress-wrap">
                    <div className={cls} style={{ "--p": `${percent}%`, "--fill": fill }}>
                        <span className="label-course-info">{label}</span>
                    </div>
                </div>
            );
        }

        if (lower.includes("overdue")) {
            label = "Overdue";
            cls += " is-overdue";
            return (
                <div className="course-home-info-progress-wrap">
                    <div className={cls} style={{ "--p": "100%", "--fill": "#CB6F6F" }}>
                        <span className="label-course-info">{label}</span>
                    </div>
                </div>
            );
        }

        if (lower.includes("not passed")) {
            label = "Not Passed";
            return (
                <div className="course-home-info-progress-wrap">
                    <div className={cls} style={{ "--p": "100%", "--fill": "#FFC000" }}>
                        <span className="label-course-info">{label}</span>
                    </div>
                </div>
            );
        }

        // Fallback: treat as 0% in-progress
        return (
            <div className="course-home-info-progress-wrap">
                <div className={cls} style={{ "--p": "0%", "--fill": fill }}>
                    In Progress 0%
                </div>
            </div>
        );
    };


    const filtered = courses;
    return (
        <div className="course-home-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>

                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Visitor Induction Management</p>
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

            <div className="main-box-course-home-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="course-home-info-wrapper">
                    {/* Welcome header (avatar + name) */}
                    <div className="course-home-info-topbar">
                        <div className="course-home-info-avatar">{getVisitorInitials()}</div>
                        <div className="course-home-info-welcome">Welcome Back, {getVisitorName()}!</div>
                    </div>

                    {/* Controls: dropdown + search + sort */}
                    <div className="course-home-info-card">
                        {/* Table box with scrollable body */}
                        <div className="course-home-info-tablebox">
                            <div className="table-container-course-home-info">
                                <table className="course-home-info-table">
                                    <thead className="course-home-info-head">
                                        <tr className="course-home-info-tr">
                                            <th className="course-home-info-num" style={{ width: "5%" }}>Nr</th>
                                            <th className="course-home-info-code" style={{ width: "20%" }}>Visitor Induction</th>
                                            <th className="course-home-info-name" style={{ width: "10%" }}>Version Nr</th>
                                            <th className="course-home-info-progress" style={{ width: "10%" }}>Progress</th>
                                            <th className="course-home-info-access" style={{ width: "10%" }}>Last Access Date</th>
                                            <th className="course-home-info-name" style={{ width: "10%" }}>Validity</th>
                                            <th className="course-home-info-access" style={{ width: "10%" }}>Expiry Date</th>
                                            <th className="course-home-info-act" style={{ width: "5%" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered
                                            .filter(c => {
                                                if (viewFilter === 'Completed') return c.progressStatus.toLowerCase().includes('completed');
                                                if (viewFilter === 'In Progress') return c.progressStatus.toLowerCase().includes('in progress');
                                                if (viewFilter === 'Overdue') return c.progressStatus.toLowerCase().includes('overdue') || c.progressStatus.toLowerCase().includes('not passed');
                                                return true; // View / All
                                            })
                                            .map((course, index) => (
                                                <tr key={`${course.formData.courseTitle}-${index}`} className="course-home-info-tr" onClick={() => navigate(`/inductionView/${course._id}`)}>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{index + 1}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "left", fontFamily: "Arial" }}>{course.formData.courseTitle}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{course.version}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>
                                                        {renderProgress(course.trainee.progress)}
                                                    </td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{formatDate(course.trainee.dateAccessed) || "N/A"}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{"Invalid"}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{course.expiryDate || "N/A"}</td>
                                                    <td className="col-um">
                                                        <div className='inline-actions-um'>
                                                            <button
                                                                style={{ padding: "10px 0px", width: "100%" }}
                                                                className={"action-button-user delete-button-user"}
                                                            >
                                                                <FontAwesomeIcon icon={faCertificate} title="Delete Course" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorInductionHomePage;
