import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./TraineeDetails.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "../../Notifications/TopBarDD";
import TraineeCompletedCoursesTable from "./TraineeCompletedCoursesTable";
import TraineeCourseTable from "./TraineeCourseTable";
import { canIn, getCurrentUser } from "../../../utils/auth";

const TraineeDetails = () => {
    const navigate = useNavigate();
    const [userID, setUserID] = useState('');
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
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

            <div className="main-box-trainee-management">
                <div className="top-section-trainee-management-page">
                    <div className="icons-container-trainee-management-page">
                        <div className="burger-menu-icon-trainee-management-page-1">
                            <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
                        </div>
                    </div>

                    <div className="spacer"></div>

                    <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} risk={true} />
                </div>

                <div className={`scrollable-box-trainee-management`}>
                    <div className="input-row-trainee-management">
                        <div className={`input-box-title-trainee-management`}>
                            <h3 className="font-fam-labels-trainee-management">Trainee Name</h3>
                        </div>
                    </div>

                    <div className="trainee-tiles-stats-row">
                        <div className="trainee-tiles-stat-tile">
                            <div className="trainee-tiles-stat-circle">N/A</div>
                            <div className="trainee-tiles-stat-label">Enrolled Courses</div>
                        </div>

                        <div className="trainee-tiles-stat-tile">
                            <div className="trainee-tiles-stat-circle">N/A</div>
                            <div className="trainee-tiles-stat-label">Completed Courses</div>
                        </div>
                    </div>
                    <TraineeCourseTable />
                    <TraineeCompletedCoursesTable />
                </div>
            </div>
        </div>
    );
};

export default TraineeDetails;