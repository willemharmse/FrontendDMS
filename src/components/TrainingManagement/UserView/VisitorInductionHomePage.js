import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faTrash, faBookOpen, faAward, faBook, faCertificate, faInfo, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./UserHomePageTMS.css";
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../../Notifications/TopBar";
import { canIn, getCurrentUser } from "../../../utils/auth";
import { saveAs } from "file-saver";
import PopupMenuPubInduction from "../../VisitorsInduction/InductionCreation/PopupMenuPubInduction";
import PopupMenuCertificateOptions from "../../VisitorsInduction/InductionCreation/PopupMenuCertificateOptions";
import ProgressNote from "./ProgressNote";
import ValidityNote from "./ValidityNote";

const VisitorInductionHomePage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const access = getCurrentUser();
    const [viewFilter, setViewFilter] = useState("View");
    const [sortAsc, setSortAsc] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [courses, setCourses] = useState([]);
    const [traineeData, setTraineeData] = useState([]);
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [indcutionData, setInductionData] = useState([]);
    const [progressInfo, setProgressInfo] = useState(false);
    const [validInfo, setValidInfo] = useState(false);

    const openProgess = () => {
        setProgressInfo(true);
    }

    const openValid = () => {
        setValidInfo(true);
    }

    const closeProgess = () => {
        setProgressInfo(false);
    }

    const closeValid = () => {
        setValidInfo(false);
    }

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

    const handlePreview = (course) => {
        navigate("/FrontendDMS/inductionPreview", {
            state: {
                traineeData: course.trainee,
                inductionName: course.formData.courseTitle
            }
        });
    };

    const handleGenerateCertificateDocument = async (course) => {
        const inductionTitle = course?.formData?.courseTitle;
        const dataToStore = {
            traineeData: course.trainee,
            inductionName: inductionTitle
        };

        const documentName = course?.trainee?.user?.name + " " + course?.trainee?.user?.surname + " " + (inductionTitle || "Induction") + " Certificate";

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-pdf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
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

    const getDetailCertificate = async (data) => {
        setTraineeData(data.trainee);

        setInductionData(data);

        handlePreview();
    }

    const handleCertificateClick = (course) => (e) => {
        e.stopPropagation();        // ⛔ don't let the row click fire
        setHoveredFileId(hoveredFileId === course._id ? null : course._id)
    };

    // rename + fix
    const getVisitorInitials = () => {
        const f = user?.name?.[0]?.toUpperCase() ?? "";
        const l = user?.surname?.[0]?.toUpperCase() ?? "";
        return (f + l) || "??";
    };

    const formatStatus = (type) => {
        if (!type.expiryDate) {
            if (type.validity === "Invalid" || type.validity === "invalid") return "-"
        }

        if (type.validity === "requiresRetake") {
            return "Requires Retake"
        }

        return type.validity
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
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
        if (dateString === "" || dateString === null) return "N/A"
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const renderProgress = (status) => {
        const isNum = typeof status === "number";
        const text = String(status ?? "").toLowerCase();

        // derive percent
        let percent = 0;
        if (isNum && Number.isFinite(status)) {
            percent = clamp(status, 0, 100);
        } else {
            // prefer an explicit % if present
            let m = text.match(/(\d+(?:\.\d+)?)\s*%/);
            if (m) {
                percent = clamp(parseFloat(m[1]), 0, 100);
            } else {
                // fallback: first 1–3 digit number (to catch "50" or "50 of 100")
                m = text.match(/\b(\d{1,3})\b/);
                if (m) percent = clamp(parseInt(m[1], 10), 0, 100);
            }
        }

        console.log("renderProgress", status, percent);

        // defaults
        let label = `In Progress ${percent}%`;
        let fill = "#FFFF89";  // yellow-ish (progress)
        let cls = "course-home-info-progress-badge";

        if (text.includes("completed") || percent === 100) {
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

        if (text.includes("overdue")) {
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

        if (text.includes("not passed")) {
            label = "Not Passed";
            return (
                <div className="course-home-info-progress-wrap">
                    <div className={cls} style={{ "--p": "100%", "--fill": "#FFC000" }}>
                        <span className="label-course-info">{label}</span>
                    </div>
                </div>
            );
        }

        // Treat any numeric percent as in-progress even if "in progress" text is missing
        if (text.includes("in progress") || percent > 0) {
            return (
                <div className="course-home-info-progress-wrap">
                    <div className={cls} style={{ "--p": `${percent}%`, "--fill": fill }}>
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

    const getComplianceColor = (status) => {
        if (!status.expiryDate) {
            if (status.validity === "Invalid" || status.validity === "invalid") return "status-missing"
        }

        if (status.validity === "requiresRetake") {
            return "status-bad"
        }

        if (status.validity === "valid") return "status-good";
        if (status.validity === "invalid") return "status-worst";
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
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/visitorInductionMainIcon2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">Visitor Induction</p>
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

                    <div className="spacer"></div>

                    <TopBar visitor={true} />
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
                                            <th className="course-home-info-code" style={{ width: "25%" }}>Visitor Induction</th>
                                            <th className="course-home-info-name" style={{ width: "10%" }}>Version Nr</th>
                                            <th className="course-home-info-progress" style={{ width: "15%" }}>
                                                <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: "8px", color: "white" }} onClick={openProgess} />
                                                Induction Progress
                                            </th>

                                            <th className="course-home-info-name" style={{ width: "10%" }}>
                                                <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: "8px", color: "white" }} onClick={openValid} />
                                                Validity
                                            </th>
                                            <th className="course-home-info-access" style={{ width: "15%" }}>Expiry Date</th>
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
                                                <tr key={`${course.formData.courseTitle}-${index}`} className="course-home-info-tr"
                                                    onClick={
                                                        handleCertificateClick(course)
                                                    }>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{index + 1}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "left", fontFamily: "Arial", position: "relative" }}>
                                                        {course.formData.courseTitle}

                                                        {(hoveredFileId === course._id) && (
                                                            <PopupMenuCertificateOptions
                                                                file={course}
                                                                downloadCertficate={handleGenerateCertificateDocument}
                                                                previewCertificate={handlePreview}
                                                                isOpen={hoveredFileId === course._id}
                                                                setHoveredFileId={setHoveredFileId}
                                                                id={course._id}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{course.version}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>
                                                        {renderProgress(course.trainee.progress)}
                                                    </td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }} className={`${getComplianceColor(course.trainee)}`}>{formatStatus(course.trainee)}</td>
                                                    <td style={{ fontSize: "14px", textAlign: "center", fontFamily: "Arial" }}>{formatDate(course.trainee.expiryDate) || "N/A"}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {progressInfo && (<ProgressNote setClose={closeProgess} />)}
            {validInfo && (<ValidityNote setClose={closeValid} />)}
        </div>
    );
};

export default VisitorInductionHomePage;
