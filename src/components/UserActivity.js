import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import TopBar from "./Notifications/TopBar";
import "./UserActivity.css";

const UserActivity = () => {
    const [activity, setActivity] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const { id } = useParams(); // Get the user ID from the URL parameters
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        if (token) {
            fetchActivity();
        }
    }, [token]);

    // Fetch files from the API
    const fetchActivity = async () => {
        const route = `/api/activity/${id}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    // 'Authorization': `Bearer ${token}` // Uncomment and fill in the token if needed
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            setActivity(data.activities.reverse());
        } catch (error) {
            setError(error.message);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const hours = String(date.getHours()).padStart(2, '0'); // Get hours with leading zero
        const minutes = String(date.getMinutes()).padStart(2, '0'); // Get minutes with leading zero
        const seconds = String(date.getSeconds()).padStart(2, '0'); // Get seconds with leading zero

        return `${hours}:${minutes}`;
    };

    return (
        <div className="user-activity-log-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">User Activity</p>
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

            <div className="main-box-user-activity-log">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                <div className="table-container-user-activity-log">
                    <table className="user-activity-log-table">
                        <thead className="user-activity-log-head">
                            <tr>
                                <th className="user-activity-log-th">Nr</th>
                                <th className="user-activity-log-th">Action</th>
                                <th className="user-activity-log-th">Date</th>
                                <th className="user-activity-log-th">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.length > 0 ? (
                                activity.map((act, index) => (
                                    <tr key={act._id} className={`file-info-row-height user-activity-log-tr`}>
                                        <td className="user-activity-log-nr">{index + 1}</td>
                                        <td className="user-activity-log-ver" style={{ textAlign: "left" }}>{act.action}</td>
                                        <td className="user-activity-log-fn">{formatDate(act.timestamp)}</td>
                                        <td className="user-activity-log-stat">{formatTime(act.timestamp)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">No Activity Log Present</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default UserActivity;