import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import './ConstructionPage.css';

const ConstructionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="construction-container">
      <FontAwesomeIcon icon={faTools} className="construction-icon" />
      <h1 className="construction-title">Under Construction</h1>
      <p className="construction-message">This page is currently being built.</p>
      <button className="construction-back-to-home" onClick={() => navigate('/FrontendDMS/home')}>
        Back to Home
      </button>
    </div>
  );
};

export default ConstructionPage;
