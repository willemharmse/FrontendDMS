import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import Notifications from "./Notifications";

const TopBar = ({ role, menu, setReset }) => {
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
        <div className="icons-container">
            <div className="burger-menu-icon-um">
                <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
            </div>
            <div className="burger-menu-icon-um notifications-bell-wrapper">
                <FontAwesomeIcon icon={faBell} onClick={() => setShowNotifications(!showNotifications)} title="Notifications" />
                {count != 0 && <div className="notifications-badge">{count}</div>}{/* Replace with unread count from backend later */}
            </div>
            <div className="burger-menu-icon-um">
                <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" />
            </div>
            {showNotifications && (<Notifications setClose={setShowNotifications} />)}
            {(isMenuOpen && menu === "Admin") && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} admin={"admin"} reset={true} setReset={setReset} />)}
            {(isMenuOpen && menu != "Admin") && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} reset={true} setReset={setReset} />)}
        </div>
    );
};

export default TopBar;