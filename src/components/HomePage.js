import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap, faClipboardList, faFileAlt, faFolderOpen, faFileSignature, faCertificate, faCircle } from "@fortawesome/free-solid-svg-icons";
import "./HomePage.css";
import { toast, ToastContainer } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import FirstLoginPopup from "./UserManagement/FirstLoginPopup";
import { isAdmin, getCurrentUser, hasRole } from "../utils/auth";

const HomePage = () => {
  const navigate = useNavigate();
  const access = getCurrentUser();
  const [showPopup, setShowPopup] = useState(localStorage.getItem("firstLogin") === "true");

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/FrontendDMS/");
  };

  const handleNavigateAdmin = () => {
    navigate("/FrontendDMS/admin");
  };

  const RAW_MENU = [
    {
      title: "Document Management", src: "DM.png", icon: faFolderOpen, path: "/FrontendDMS/documentManageHome", category: "DMS"
    },
    {
      title: "Document Development", src: "DC.png", icon: faFileSignature, path: "/FrontendDMS/documentCreateHome", category: "DDS"
    },
    {
      title: "Risk Management", src: "RM.png", icon: faClipboardList, path: "/FrontendDMS/riskHome", category: "RMS"
    },
    {
      title: "Training Management", src: "TM.png", icon: faGraduationCap, path: "/FrontendDMS/courseHomeViewPage", category: "TMS"
    },
    {
      title: "Flameproof Management", src: "FCMS.svg", icon: faGraduationCap, path: "/FrontendDMS/flameManageSites", category: "FCMS"
    },
    // {
    //   title: "Compliance Management", src: "CM.png", icon: faFileAlt, path: "/constructionCM", category: "CMS"
    // },
  ];

  const menuItems = useMemo(() => {
    if (!access) return [];
    return RAW_MENU
      .filter(item => {
        return hasRole(access, item.category);
      })
      // Strip gating fields before rendering (optional)
      .map(({ category, adminOnly, ...rest }) => rest);
  }, [access]);

  return (
    <div className="homepage-container">
      {showPopup && (<FirstLoginPopup onClose={() => setShowPopup(false)} />)}
      <header className="header">
        <img src="CH_Logo.svg" alt="Logo" className="header-logo" />
        <h1>ComplianceHub{"\u2122"}</h1>
      </header>
      <div className="content-grid">
        {menuItems.map((item, index) => (
          <div key={index} className="card" onClick={() => navigate(item.path)}>
            <div className="card-content">
              <img src={item.src} alt="Logo" className={`${item.src === "TM.png" ? "card-icon-hat" : "card-icon"} ${item.src === "FCMS.svg" ? "card-icon-flames" : "card-icon"} ${item.src === "DM.png" ? "card-icon-dm" : "card-icon"} ${item.src === "RM.png" ? "card-icon-rm" : "card-icon"} ${item.src === "DC.png" ? "card-icon-dc" : "card-icon"} ${item.src === "CM.png" ? "card-icon-cm" : "card-icon"}`} />
            </div>
            <h3>{item.title}</h3>
          </div>
        ))}
      </div>
      <div className="logo-bottom-container">
        <img className="logo-bottom" src="logo.webp" alt="Bottom Logo" />
        <p className="logo-bottom-text">A TAU5 PRODUCT</p>
      </div>
      {isAdmin(access) && (<button className="admin-page-home-button" onClick={handleNavigateAdmin}>Admin Page</button>)}
      <button className="logout-button" onClick={handleLogout}>Log Out</button>
      <button className="coming-soon-button" onClick={() => navigate("/FrontendDMS/futureEnhancement")}>Coming Soon</button>
      <ToastContainer />
    </div>
  );
};

export default HomePage;