import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faFileCircleCheck, faFileCirclePlus, faFile, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [clicked1, setClicked1] = useState(false);
  const [clicked2, setClicked2] = useState(false);
  const [clicked3, setClicked3] = useState(false);
  const [clicked4, setClicked4] = useState(false);
  const [clicked5, setClicked5] = useState(false);

  const handleClick = (setClicked, navigateTo) => {
    setClicked(true);

    setTimeout(() => {
      setClicked(false); // Reset color first
      setTimeout(() => {
        navigate(navigateTo); // Navigate after transition ends
      }, 350); // Wait for transition to complete before navigating
    }, 200); // Ensure this matches your transition duration
  };

  return (
    <div className="homepage-container">
      {/* Header Section */}
      <header className="header">
        <div className="header-content">
          <img src="logo.webp" alt="Logo" className="header-logo" />
          <h1>TAU5 COMPLIANCEHUB</h1>
        </div>
      </header>

      {/* Content Sections */}
      <div className="content-sections">
        {/* Left Section */}
        <div className="section">
          <div className={`card ${clicked1 ? 'clicked' : ''}`} onClick={() => handleClick(setClicked1, "/FrontendDMS/documentManage")}>
            <FontAwesomeIcon icon={faFile} className="logo" />
            <h3>DOCUMENT MANAGEMENT</h3>
          </div>
          <div className={`card ${clicked2 ? 'clicked' : ''}`} onClick={() => handleClick(setClicked2, "/FrontendDMS/documentCreate")}>
            <FontAwesomeIcon icon={faFileCirclePlus} className="logo" />
            <h3>DOCUMENT DEVELOPMENT</h3>
          </div>
          <div className={`card ${clicked3 ? 'clicked' : ''}`} onClick={() => handleClick(setClicked3, "/FrontendDMS/construction")}>
            <FontAwesomeIcon icon={faTriangleExclamation} className="logo" />
            <h3>RISK ASSESSMENT</h3>
          </div>
        </div>

        {/* Right Section */}
        <div className="section">
          <div className={`card ${clicked4 ? 'clicked' : ''}`} onClick={() => handleClick(setClicked4, "/FrontendDMS/construction")}>
            <FontAwesomeIcon icon={faFileCircleCheck} className="logo" />
            <h3>COMPLIANCE GOVERNANCE</h3>
          </div>
          <div className={`card ${clicked5 ? 'clicked' : ''}`} onClick={() => handleClick(setClicked5, "/FrontendDMS/construction")}>
            <FontAwesomeIcon icon={faChalkboardTeacher} className="logo" />
            <h3>TRAINING MANAGEMENT</h3>
          </div>
          <div className="card-blank">
          </div>
        </div>

        <button className="logout-button" onClick={() => navigate("/FrontendDMS/")}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default HomePage;