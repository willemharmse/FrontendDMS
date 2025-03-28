import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenuFI.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const BurgerMenuFI = ({ role, isOpen, setIsOpen }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("rememberMe");
        navigate("/FrontendDMS/");
    };

    return (
        <div className="burger-menu-container-FI">
            {isOpen && (
                <div className="menu-content-FI" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={handleLogout}>Logout</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuFI;