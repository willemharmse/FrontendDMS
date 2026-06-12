import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenuFI.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const InfoBurgerMenuHomePage = ({ isOpen, setIsOpen, onProductPresentation, onProductTraining }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="burger-menu-container-home-page">
            {isOpen && (
                <div className="menu-content-FI" onMouseLeave={() => setIsOpen(false)}>
                    <ul>
                        <li onClick={() => { onProductPresentation(); setIsOpen(false); }}>
                            Product Overview
                        </li>
                        <li onClick={() => { onProductTraining(); setIsOpen(false); }}>
                            Training Material
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InfoBurgerMenuHomePage;