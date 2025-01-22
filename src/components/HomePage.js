import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faFileCircleCheck } from '@fortawesome/free-solid-svg-icons';
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage-container">
      {/* Header Section */}
      <header className="header">
        <div className="header-content">
          <img src="/logo.webp" alt="Logo" className="header-logo" />
          <h1>TAU5 COMPLIANCE AND KNOWLEDGE MANAGEMENT SYSTEM</h1>
        </div>
      </header>

      {/* Content Sections */}
      <div className="content-sections">
        {/* Left Section */}
        <div className="section">
          <div className="card" onClick={() => navigate("/FrontendDMS/documentManage")}>
            <img src="/docMan.png" alt="Document Management" />
            <h3>DOCUMENT MANAGEMENT</h3>
          </div>
          <div className="card" onClick={() => navigate("/FrontendDMS/documentCreate")}>
            <img src="/docCreate.png" alt="Document Development" />
            <h3>DOCUMENT DEVELOPMENT</h3>
          </div>
        </div>

        {/* Right Section */}
        <div className="section">
          <div className="card" onClick={() => navigate("/compliance-governance")}>
            <FontAwesomeIcon icon={faFileCircleCheck} className="logo" />
            <h3>COMPLIANCE GOVERNANCE</h3>
          </div>
          <div className="card" onClick={() => navigate("/training-management")}>
            <FontAwesomeIcon icon={faChalkboardTeacher} className="logo" />
            <h3>TRAINING MANAGEMENT</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;