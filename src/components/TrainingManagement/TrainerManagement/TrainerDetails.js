import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./TrainerDetails.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "../../Notifications/TopBarDD";
import TrainerCourseTable from "./TrainerCourseTable";
import TrainerTraineesTable from "./TrainerTraineesTable";

const TrainerDetails = () => {
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

            <div className="main-box-trainer-details-management">
                <div className="top-section-trainer-details-management-page">
                    <div className="icons-container-trainer-details-management-page">
                        <div className="burger-menu-icon-trainer-details-management-page-1">
                            <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
                        </div>
                    </div>

                    <div className="spacer"></div>

                    <TopBarDD role={role} menu={"1"} create={false} risk={false} />
                </div>

                <div className={`scrollable-box-trainer-details-management`}>
                    <div className="input-row-trainer-details-management">
                        <div className={`input-box-title-trainer-details-management`}>
                            <h3 className="font-fam-labels-trainer-details-management">Trainer Name</h3>
                        </div>
                    </div>

                    <div className="trainer-management-stats-row">
                        <div className="trainer-management-stat-tile">
                            <div className="trainer-management-stat-circle">N/A</div>
                            <div className="trainer-management-stat-label">Total Assigned Trainees</div>
                        </div>

                        <div className="trainer-management-stat-tile">
                            <div className="trainer-management-stat-circle">N/A</div>
                            <div className="trainer-management-stat-label">Total Allocated Courses</div>
                        </div>
                    </div>

                    <TrainerCourseTable />
                    <TrainerTraineesTable />
                </div>
            </div>
        </div>
    );
};

export default TrainerDetails;