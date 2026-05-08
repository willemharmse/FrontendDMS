import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowCircleRight, faArrowLeft, faArrowRight, faArrowRotateLeft, faArrowRotateRight, faArrowsRotate, faBell, faCircleUser, faGroupArrowsRotate, faHome, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import Notifications from "./Notifications";

const TopBar = ({ refreshable = true, menu, setReset, isProfile = false, visitor = false, student = false, showInfo = false, type }) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [count, setCount] = useState(""); // Placeholder for unread notifications count
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        // Load from sessionStorage on mount
        const cached = sessionStorage.getItem('profilePic') || sessionStorage.getItem('profilePicStudent');
        setProfilePic(cached || null);
    }, []);

    const fetchNotificationCount = async () => {
        const route = `/api/notifications/count`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch notification count');
            }
            const data = await response.json();
            setCount(data.notifications);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotificationCount();
    }, []);

    return (
        <div className="icons-container">
            {refreshable && (<div className="burger-menu-icon-create-page-2">
                <FontAwesomeIcon
                    icon={faArrowsRotate}
                    title="Refresh Page"
                    style={{ cursor: "pointer" }}
                    onClick={() => window.location.reload()}
                />
            </div>)}
            {showInfo && (<div className="burger-menu-icon-create-page-2">
                <FontAwesomeIcon
                    icon={faInfoCircle}
                    title="Info"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/FrontendDMS/infoHelp/${type}`)}
                />
            </div>)}
            <div className="burger-menu-icon-um-home">
                <FontAwesomeIcon onClick={() => navigate(!visitor ? !student ? "/FrontendDMS/home" : "/FrontendDMS/studentHomePage" : "/FrontendDMS/visitorHomePage")} icon={faHome} title="Home" />
            </div>
            {(!visitor && !student) && (<div className="burger-menu-icon-um notifications-bell-wrapper">
                <FontAwesomeIcon icon={faBell} onClick={() => setShowNotifications(!showNotifications)} title="Notifications" />
                {count != 0 && <div className="notifications-badge"></div>}{/* Replace with unread count from backend later */}
            </div>)}
            <div className="burger-menu-icon-um" onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" style={{ cursor: "pointer" }}>
                {profilePic && (!visitor) ? (
                    <img
                        src={profilePic}
                        alt="Profile"
                        style={{
                            width: "28px",          // match icon size
                            height: "28px",
                            borderRadius: "50%",    // circle
                            objectFit: "cover",
                            display: "block"
                        }}
                    />
                ) : (
                    <FontAwesomeIcon icon={faCircleUser} />
                )}
            </div>
            {showNotifications && (<Notifications setClose={setShowNotifications} getCount={fetchNotificationCount} />)}
            {(isMenuOpen && menu === "Admin") && (<BurgerMenuFI isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} admin={"admin"} reset={true} setReset={setReset} isProfile={isProfile} />)}
            {(isMenuOpen && menu != "Admin") && (<BurgerMenuFI isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} reset={true} setReset={setReset} isProfile={isProfile} visitor={visitor} student={student} />)}
        </div>
    );
};

export default TopBar;