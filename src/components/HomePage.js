import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap, faClipboardList, faFileAlt, faFolderOpen, faFileSignature } from "@fortawesome/free-solid-svg-icons";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("rememberMe");
    navigate("/FrontendDMS/");
  };

  const menuItems = [
    { title: "Document Management", src: "DM.png", icon: faFolderOpen, path: "/FrontendDMS/documentManageHome" },
    { title: "Document Development", src: "DC.png", icon: faFileSignature, path: "/FrontendDMS/documentCreate" },
    { title: "Risk Management", src: "RM.png", icon: faClipboardList, path: "/FrontendDMS/constructionRM" },
    { title: "Training Management", src: "TM.png", icon: faGraduationCap, path: "/FrontendDMS/constructionTM" },
    { title: "Compliance Management", src: "CM.png", icon: faFileAlt, path: "/FrontendDMS/constructionCM" },
  ];

  return (
    <div className="homepage-container">
      <header className="header">
        <img src="CH_Logo.png" alt="Logo" className="header-logo" />
        <h1>ComplianceHub{"\u2122"}</h1>
      </header>
      <div className="content-grid">
        {menuItems.map((item, index) => (
          <div key={index} className="card" onClick={() => navigate(item.path)}>
            <div className="card-content">
              <img src={item.src} alt="Logo" className={`${item.src === "TM.png" ? "card-icon-hat" : "card-icon"} ${item.src === "DM.png" ? "card-icon-dm" : "card-icon"} ${item.src === "RM.png" ? "card-icon-rm" : "card-icon"} ${item.src === "DC.png" ? "card-icon-dc" : "card-icon"} ${item.src === "CM.png" ? "card-icon-cm" : "card-icon"}`} />
            </div>
            <h3>{item.title}</h3>
          </div>
        ))}
      </div>
      <div className="logo-bottom-container">
        <img className="logo-bottom" src="logo.webp" alt="Bottom Logo" />
        <p className="logo-bottom-text">A TAU5 PRODUCT</p>
      </div>
      <button className="logout-button" onClick={handleLogout}>Log Out</button>
    </div>
  );
};

export default HomePage;