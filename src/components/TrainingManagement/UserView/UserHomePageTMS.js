import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faTrash, faBookOpen, faAward, faBook } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./UserHomePageTMS.css";
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../../Notifications/TopBar";
import { canIn, getCurrentUser } from "../../../utils/auth";

const UserHomePageTMS = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const access = getCurrentUser();
    const [viewFilter, setViewFilter] = useState("View");
    const [sortAsc, setSortAsc] = useState(true);

    const courseData = [
        {
            courseCode: "C001",
            courseName: "Mine XYZ Induction Program",
            progressStatus: "Completed 100%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C002",
            courseName: "Surface Mine Health and Safety Orientation",
            progressStatus: "Completed 100%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C003",
            courseName: "Haul Truck Operator Training",
            progressStatus: "Completed 100%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C004",
            courseName: "Drill and Blast Fundamentals (Surface)",
            progressStatus: "In Progress 50%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C005",
            courseName: "Environmental Compliance for Surface Mining",
            progressStatus: "In Progress 50%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C006",
            courseName: "Front-End Loader (FEL) Operator Training",
            progressStatus: "In Progress 22%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C007",
            courseName: "Working at Heights – Surface Operations",
            progressStatus: "Not Passed",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C008",
            courseName: "Basic First Aid – Surface Mine",
            progressStatus: "Overdue",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C009",
            courseName: "Firefighting & Emergency Response (Surface)",
            progressStatus: "Completed 100%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C010",
            courseName: "Pit Dewatering and Water Management",
            progressStatus: "Completed 100%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C011",
            courseName: "Grader Operator Training",
            progressStatus: "Completed 100%",
            lastAccessDate: "12.08.2025"
        },
        {
            courseCode: "C012",
            courseName: "Surface Conveyor Belt Safety and Inspection",
            progressStatus: "In Progress 50%",
            lastAccessDate: "12.08.2025"
        }
    ];

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


    const filtered = courseData
        .filter(c =>
            [c.courseCode, c.courseName, c.progressStatus, c.lastAccessDate]
                .join(' ')
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const dir = sortAsc ? 1 : -1;
            // sort by Course Code (as in many tables) — tweak if you prefer Name
            return a.courseCode.localeCompare(b.courseCode) * dir;
        });

    return (
        <div className="course-home-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>

                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="button-container-create">
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon
                                    icon={faBookOpen}
                                    className="button-icon"
                                />
                                <span className="button-text">My Courses</span>
                            </div>
                        </button>
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon icon={faAward} className="button-icon" />
                                <span className="button-text">Certificates</span>
                            </div>
                        </button>
                        <button className="but-um">
                            <div className="button-content">
                                <FontAwesomeIcon
                                    icon={faBook}
                                    className="button-icon"
                                />
                                <span className="button-text">Site Passport</span>
                            </div>
                        </button>
                    </div>

                    {canIn(access, "TMS", "systemAdmin") && (
                        <div className="sidebar-logo-dm-fi">
                            <div className="risk-button-container-create-bot">
                                <button className="but-um" onClick={() => navigate("/FrontendDMS/tmsAdmin/manageTraining")}>
                                    <div className="button-content">
                                        <img src={`${process.env.PUBLIC_URL}/tmsTrainingAdmin.svg`} className={"button-logo-custom"} />
                                        <span className="button-text">Manage TMS</span>
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
                        <div className="course-home-info-avatar">JS</div>
                        <div className="course-home-info-welcome">Welcome Back, John</div>
                    </div>

                    {/* Controls: dropdown + search + sort */}
                    <div className="course-home-info-card">
                        <div className="course-home-info-controls">
                            <select
                                className="course-home-info-select"
                                value={viewFilter}
                                onChange={(e) => setViewFilter(e.target.value)}
                            >
                                <option value="View">View</option>
                                <option value="All">All</option>
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Overdue">Overdue / Not Passed</option>
                            </select>

                            <div className="course-home-info-search-wrap">
                                <div className="course-home-info-search-icon-wrap">
                                    <input
                                        className="course-home-info-search"
                                        placeholder="Search Course"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <span className="course-home-info-search-icon">
                                        <FontAwesomeIcon icon={faSearch} />
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="course-home-info-sort"
                                title={`Sort by Course Code ${sortAsc ? '(A→Z)' : '(Z→A)'}`}
                                onClick={() => setSortAsc(!sortAsc)}
                            >
                                <FontAwesomeIcon icon={faSort} />
                            </button>
                        </div>

                        {/* Table box with scrollable body */}
                        <div className="course-home-info-tablebox">
                            <div className="table-container-course-home-info">
                                <table className="course-home-info-table">
                                    <thead className="course-home-info-head">
                                        <tr className="course-home-info-tr">
                                            <th className="course-home-info-num">Nr</th>
                                            <th className="course-home-info-code">Course Code</th>
                                            <th className="course-home-info-name">Course Name</th>
                                            <th className="course-home-info-progress">Progress</th>
                                            <th className="course-home-info-access">Last Access Date</th>
                                            <th className="course-home-info-act">Action</th>
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
                                                <tr key={`${course.courseCode}-${index}`} className="course-home-info-tr">
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{index + 1}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{course.courseCode}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "left", fontFamily: "Arial" }}>{course.courseName}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>
                                                        {renderProgress(course.progressStatus)}
                                                    </td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{course.lastAccessDate}</td>
                                                    <td className="col-um">
                                                        <div className='inline-actions-um'>
                                                            <button
                                                                style={{ padding: "10px 0px", width: "100%" }}
                                                                className={"action-button-user delete-button-user"}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} title="Delete Course" />
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

export default UserHomePageTMS;
