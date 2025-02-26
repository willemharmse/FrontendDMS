import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenu.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

const BurgerMenu = ({ role, openLoadPopup, small }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();


    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("rememberMe");
        navigate("/FrontendDMS/");
    };

    return (
        <div className="burger-menu-container">
            <button className={`menu-button-cp ${small ? " small" : ""}`} onClick={toggleMenu} title="Show more options">
                <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
            </button>
            {isOpen && (
                <div className="menu-content" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        {role === "admin" && (
                            <li onClick={() => navigate('/FrontendDMS/importValues')}>Import Site Info</li>
                        )}

                        {role === "admin" && (
                            <li onClick={openLoadPopup}>Load draft</li>
                        )}
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenu;