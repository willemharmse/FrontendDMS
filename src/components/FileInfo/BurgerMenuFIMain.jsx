import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenuFIMain.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const BurgerMenuFIMain = ({ isOpen, setIsOpen, toggleTrashView, isTrashView, openRDPopup, canIn, access }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/FrontendDMS/");
    };

    return (
        <div className="burger-menu-container-FI-main">
            {isOpen && (
                <div className="menu-content-FI-main" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={() => navigate("/FrontendDMS/userProfile")}>My Profile</li>
                        {canIn(access, "DMS", ["systemAdmin", "contributor"]) && (<li onClick={toggleTrashView}>{isTrashView ? "Show All Files" : "Show Trash"}</li>)}
                        {canIn(access, "DMS", ["systemAdmin", "contributor"]) && (<li onClick={openRDPopup}>Highlight Review Dates</li>)}
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuFIMain;