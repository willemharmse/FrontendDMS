import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./CourseDetails.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "../Notifications/TopBarDD";
import CourseTraineeTable from "./CourseTraineeTable";
import CourseTrainerTable from "./CourseTrainerTable";

const CourseDetails = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState("");
    const [userID, setUserID] = useState('');
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/403");
            }

            setUserID(decodedToken.userId);
            setRole(decodedToken.role);
        }
    }, [navigate]);

    return (
        <div className="course-details-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src="/CH_Logo.svg" alt="Logo" className="logo-img-um" onClick={() => navigate('/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
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

            <div className="main-box-course-details">
                <div className="top-section-course-details-page">
                    <div className="icons-container-course-details-page">
                        <div className="burger-menu-icon-course-details-page-1">
                            <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
                        </div>
                    </div>

                    <div className="spacer"></div>

                    <TopBarDD role={role} menu={"1"} create={true} risk={true} />
                </div>

                <div className={`scrollable-box-course-details`}>
                    <div className="input-row-course-details">
                        <div className={`input-box-title-course-details`}>
                            <h3 className="font-fam-labels-course-details">Course Code - Course Name</h3>
                        </div>
                    </div>

                    <div className="cd-stats-row">
                        <div className="cd-stat-tile">
                            <div className="cd-stat-circle">N/A</div>
                            <div className="cd-stat-label">Total Trainees</div>
                        </div>

                        <div className="cd-stat-tile">
                            <div className="cd-stat-circle">N/A</div>
                            <div className="cd-stat-label">Total Trainers</div>
                        </div>

                        <div className="cd-stat-tile">
                            <div className="cd-stat-circle">N/A</div>
                            <div className="cd-stat-label">Training Groups</div>
                        </div>

                        <div className="cd-stat-tile">
                            {/* Yellow circle variant, if you want the completion “badge” look */}
                            <div className="cd-stat-circle cd-circle-yellow">75%</div>
                            <div className="cd-stat-label">Trainee Completion Status</div>
                        </div>
                    </div>

                    <CourseTrainerTable />
                    <CourseTraineeTable />
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;