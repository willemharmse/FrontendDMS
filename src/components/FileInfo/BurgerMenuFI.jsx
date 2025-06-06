import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenuFI.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const BurgerMenuFI = ({ role, isOpen, setIsOpen, admin, reset, setReset }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/FrontendDMS/");
    };

    return (
        <div className="burger-menu-container-FI">
            {isOpen && (
                <div className="menu-content-FI" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        {reset && <li onClick={() => setReset(true)}>Change Password</li>}
                        <li onClick={handleLogout}>Logout</li>

                    </ul>
                </div>
            )}
        </div>
    );
};

export default BurgerMenuFI;