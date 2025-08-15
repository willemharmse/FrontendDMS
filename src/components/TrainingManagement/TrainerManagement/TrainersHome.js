import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./TrainersHome.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faArrowLeft, faSearch, faCaretLeft, faCaretRight, faUser, faPersonChalkboard } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../../Notifications/TopBar";
import TrainersDetailTable from "./TrainersDetailTable";

const TrainersHome = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'developer'];
    const leaderRoles = ['teamleader'];
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const trainers = [
        { trainerName: "Abel Moetji", email: "amoetji@tau5.co.za", dateAdded: "2025-03-17" },
        { trainerName: "Anzel Swanepoel", email: "aswanepoel@tau5.co.za", dateAdded: "2025-03-17" },
        { trainerName: "Jane Doe", email: "jdoe@tau5.co.za", dateAdded: "2025-03-17" },
        { trainerName: "Johan Crouse", email: "jcrause@tau5.co.za", dateAdded: "2025-03-17" },
        { trainerName: "Quintin Coetzee", email: "qcoetzee@tau5.co.za", dateAdded: "2025-03-17" },
        { trainerName: "Rossouw Snyders", email: "rsnyders@tau5.co.za", dateAdded: "2025-03-17" },
        { trainerName: "Willem Harmse", email: "wharmse@tau5.co.za", dateAdded: "2025-03-17" },
        { trainerName: "Zandre Meyer", email: "zmeyer@tau5.co.za", dateAdded: "2025-03-17" },
    ];


    const clearSearch = () => {
        setSearchQuery("");
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
            setloggedInUserId(decodedToken.userId);

            if (!(adminRoles.includes(decodedToken.role)) && !(leaderRoles.includes(decodedToken.role))) {
                navigate("/403");
            }
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
                                    <FontAwesomeIcon icon={faUser} className="button-icon" />
                                    <span className="button-text">New Trainer</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <FontAwesomeIcon icon={faPersonChalkboard} alt="Logo" className="logo-img-dept-view" />
                        <p className="logo-text-dm-fi">{"Manage Trainers"}</p>
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

                    <div className="info-box-um">Number of Trainers: {trainers.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>

                <TrainersDetailTable filteredTrainers={trainers} />
            </div>
            <ToastContainer />
        </div>
    );
};

export default TrainersHome;