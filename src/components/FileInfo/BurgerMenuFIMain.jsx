import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenuFIMain.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const BurgerMenuFIMain = ({ role, isOpen, setIsOpen, toggleTrashView, isTrashView, openRDPopup }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="burger-menu-container-FI-main">
            {isOpen && (
                <div className="menu-content-FI-main" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={toggleTrashView}>{isTrashView ? "Show All Files" : "Show Trash"}</li>
                        <li onClick={() => navigate("/userProfile")}>My Profile</li>
                        <li onClick={openRDPopup}>Highlight Review Dates</li>
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuFIMain;