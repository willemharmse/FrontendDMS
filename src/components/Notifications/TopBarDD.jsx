import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faCircleExclamation, faHome } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import Notifications from "./Notifications";
import BurgerMenu from "../CreatePage/BurgerMenu";

const TopBarDD = ({ role, menu, create, loadOfflineDraft }) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [count, setCount] = useState(""); // Placeholder for unread notifications count

    useEffect(() => {
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

        fetchNotificationCount();
    }, []);

    return (
        <div className="icons-container-create-page">
            {(localStorage.getItem("draftData") && create) && (
                <div className="burger-menu-icon-create-page-3" onClick={() => loadOfflineDraft()}>
                    <FontAwesomeIcon icon={faCircleExclamation} title="Load Offline Draft" />
                </div>
            )}
            <div className="burger-menu-icon-create-page-2">
                <FontAwesomeIcon onClick={() => navigate('/FrontendDMS/home')} icon={faHome} title="Home" />
            </div>
            <div className="burger-menu-icon-create-page-2">
                <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
            </div>
            <div className="burger-menu-icon-um notifications-bell-wrapper">
                <FontAwesomeIcon icon={faBell} onClick={() => setShowNotifications(!showNotifications)} title="Notifications" />
                {count != 0 && <div className="notifications-badge">{count}</div>} {/* Replace with unread count from backend later */}
            </div>
            <div className="burger-menu-icon-create-page-3" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <FontAwesomeIcon icon={faCircleUser} title="Menu" />
            </div>

            {showNotifications && (<Notifications setClose={setShowNotifications} />)}
            {(isMenuOpen && menu != "1") && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
            {(isMenuOpen && menu === "1") && (<BurgerMenu role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
        </div>
    );
};

export default TopBarDD;