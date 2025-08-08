import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faCircleExclamation, faHome } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import Notifications from "./Notifications";
import BurgerMenu from "../CreatePage/BurgerMenu";

const TopBarDD = ({ role, menu, create, loadOfflineDraft, risk = false }) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [count, setCount] = useState(""); // Placeholder for unread notifications count
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        // Load from sessionStorage on mount
        const cached = sessionStorage.getItem('profilePic');
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
        <div className="icons-container-create-page">
            <div className="burger-menu-icon-create-page-2">
                <FontAwesomeIcon onClick={() => navigate("/FrontendDMS/home")} icon={faHome} title="Home" />
            </div>
            <div className="burger-menu-icon-um notifications-bell-wrapper">
                <FontAwesomeIcon icon={faBell} onClick={() => setShowNotifications(!showNotifications)} title="Notifications" />
                {count != 0 && <div className="notifications-badge"></div>} {/* Replace with unread count from backend later */}
            </div>
            <div className="burger-menu-icon-create-page-3" onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" style={{ cursor: "pointer" }}>
                {profilePic ? (
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
            {(isMenuOpen && menu != "1") && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
            {(isMenuOpen && menu === "1") && (<BurgerMenu role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} risk={risk} />)}
        </div>
    );
};

export default TopBarDD;