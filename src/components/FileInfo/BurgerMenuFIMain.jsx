import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenuFIMain.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const BurgerMenuFIMain = ({ role, isOpen, setIsOpen, openUpdate, toggleTrashView, isTrashView, openRDPopup }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("rememberMe");
        navigate("/FrontendDMS/");
    };

    return (
        <div className="burger-menu-container-FI-main">
            {isOpen && (
                <div className="menu-content-FI-main" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={openUpdate}>Update File</li>
                        <li onClick={toggleTrashView}>{isTrashView ? "Show All Files" : "Show Trash"}</li>
                        <li onClick={() => navigate("/FrontendDMS/userManagement")}>Manage Users</li>
                        <li onClick={openRDPopup}>Change Date Formatting</li>
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuFIMain;