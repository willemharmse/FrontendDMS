import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faCircleExclamation, faHome, faArrowsRotate, faArrowRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import Notifications from "./Notifications";
import BurgerMenu from "../CreatePage/BurgerMenu";
import InfoMenu from "./InfoMenu";

/**
 * TopBarDD
 *
 * Optional intercept props (only used on create/edit pages — ignored by all
 * other consumers so behaviour is completely isolated):
 *   onHome     – called instead of navigate('/home') when the home icon is clicked
 *   onRefresh  – called instead of window.location.reload() when the refresh icon is clicked
 *
 * When these props are not provided the component works exactly as before.
 */
const TopBarDD = ({
    refreshable = true,
    access,
    canIn,
    menu,
    create,
    loadOfflineDraft,
    risk = false,
    showInfo = false,
    type,
    // Intercept callbacks — optional, only supplied by create/edit pages
    onHome,
    onRefresh,
}) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);
    const [count, setCount] = useState("");
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
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

    const handleHomeClick = () => {
        if (onHome) {
            onHome();
        } else {
            navigate("/FrontendDMS/home");
        }
    };

    const handleRefreshClick = () => {
        if (onRefresh) {
            onRefresh();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="icons-container-create-page">
            {refreshable && (
                <div className="burger-menu-icon-create-page-2">
                    <FontAwesomeIcon
                        icon={faArrowsRotate}
                        title="Refresh Page"
                        style={{ cursor: "pointer" }}
                        onClick={handleRefreshClick}
                    />
                </div>
            )}
            {showInfo && (
                <div className="burger-menu-icon-create-page-2">
                    <FontAwesomeIcon
                        icon={faInfoCircle}
                        title="Info"
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsInfoMenuOpen(!isInfoMenuOpen)}
                    />
                </div>
            )}
            <div className="burger-menu-icon-create-page-2">
                <FontAwesomeIcon onClick={handleHomeClick} icon={faHome} title="Home" />
            </div>
            <div className="burger-menu-icon-um notifications-bell-wrapper">
                <FontAwesomeIcon icon={faBell} onClick={() => setShowNotifications(!showNotifications)} title="Notifications" />
                {count != 0 && <div className="notifications-badge"></div>}
            </div>
            <div className="burger-menu-icon-create-page-3" onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" style={{ cursor: "pointer" }}>
                {profilePic ? (
                    <img
                        src={profilePic}
                        alt="Profile"
                        style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            display: "block"
                        }}
                    />
                ) : (
                    <FontAwesomeIcon icon={faCircleUser} />
                )}
            </div>

            {showNotifications && (<Notifications setClose={setShowNotifications} getCount={fetchNotificationCount} />)}
            {isInfoMenuOpen && (
                <InfoMenu
                    isOpen={isInfoMenuOpen}
                    setIsOpen={setIsInfoMenuOpen}
                    onProductPresentation={() => navigate(`/FrontendDMS/infoHelp/${type}`)}
                    onProductTraining={() => navigate(`/FrontendDMS/infoTraining/${type}`)}
                />
            )}
            {(isMenuOpen && menu != "1") && (<BurgerMenuFI isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
            {(isMenuOpen && menu === "1") && (<BurgerMenu access={access} canIn={canIn} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} risk={risk} />)}
        </div>
    );
};

export default TopBarDD;