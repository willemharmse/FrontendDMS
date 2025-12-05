import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import TopBar from "../Notifications/TopBar";
import Select from "react-select";

const VersionHistoryAssets = () => {
    const [activity, setActivity] = useState([]);          // full history from API
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const { id } = useParams();
    const [users, setUsers] = useState([]);                // unique list of users for filter
    const [selectedUser, setSelectedUser] = useState([]);  // array of usernames/emails
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            jwtDecode(storedToken); // you’re not using it here, but this is fine
        }
    }, [navigate]);

    useEffect(() => {
        if (token) {
            fetchActivity();
        }
    }, [token]);

    // Fetch history from the API
    const fetchActivity = async () => {
        const route = `/api/flameproof/assets/${id}/history`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }
            const data = await response.json();

            let historyArray = [];

            // If backend returns { history: [...] }
            if (Array.isArray(data.history)) {
                historyArray = data.history;
            } else if (Array.isArray(data)) {
                // If backend returns plain array
                historyArray = data;
            }

            setActivity(historyArray);

            // Build unique user list (username or email as fallback)
            const uniqueUsers = [...new Set(
                historyArray.map(item => item.userName || item.userEmail || "Unknown")
            )]
                .filter(Boolean)
                .sort();

            setUsers(uniqueUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // 🔍 Filtered list based on selectedUser
    const filteredActivity = useMemo(() => {
        if (!activity || activity.length === 0) return [];
        if (!selectedUser || selectedUser.length === 0) return activity; // no filter applied

        return activity.filter(act => {
            const name = act.userName || act.userEmail || "Unknown";
            return selectedUser.includes(name);
        });
    }, [activity, selectedUser]);

    return (
        <div className="version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img
                            src={`${process.env.PUBLIC_URL}/CH_Logo.svg`}
                            alt="Logo"
                            className="logo-img-um"
                            onClick={() => navigate('/FrontendDMS/home')}
                            title="Home"
                        />
                        <p className="logo-text-um">EPA Management</p>
                    </div>

                    {/* Sidebar filter */}
                    <div className="filter-dm-fi">
                        <p className="filter-text-dm-fi">Filter</p>
                        <div className="button-container-dm-fi">
                            <div className="fi-info-popup-page-select-container">
                                <Select
                                    options={users.map(u => ({ value: u, label: u }))}
                                    isMulti
                                    onChange={(selected) =>
                                        setSelectedUser((selected || []).map(s => s.value))
                                    }
                                    className="sidebar-select remove-default-styling"
                                    placeholder="User"
                                    classNamePrefix="sb"
                                />
                            </div>
                        </div>
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

            <div className="main-box-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="spacer"></div>
                    <TopBar />
                </div>

                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Changes Made"}</label>
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        <table className="version-history-file-info-table">
                            <thead className="version-history-file-info-head">
                                <tr>
                                    <th className="version-history-file-th">Nr</th>
                                    <th className="version-history-file-th">Change Made</th>
                                    <th className="version-history-file-th">Changed By</th>
                                    <th className="version-history-file-th">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActivity && filteredActivity.length > 0 ? (
                                    filteredActivity.map((act, index) => (
                                        <tr
                                            key={act.id || act._id || index}
                                            className="file-info-row-height version-history-file-info-tr"
                                        >
                                            {/* Nr */}
                                            <td className="version-history-file-nr">
                                                {index + 1}
                                            </td>

                                            {/* Change description */}
                                            <td className="version-history-file-fn" style={{ textAlign: "left" }}>
                                                {act.changeMade}
                                            </td>

                                            {/* User Responsible */}
                                            <td className="version-history-file-stat">
                                                {act.userName || act.userEmail || "Unknown"}
                                            </td>

                                            {/* Date (and time) */}
                                            <td className="version-history-file-ver">
                                                {act.dateOfChange
                                                    ? `${formatDate(act.dateOfChange)} ${formatTime(act.dateOfChange)}`
                                                    : ""}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: "center" }}>
                                            {error ? `Error: ${error}` : "No History"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default VersionHistoryAssets;
