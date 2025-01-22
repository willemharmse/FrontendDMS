// src/components/Forbidden.js
import React from 'react';
import './Forbidden.css'; // Import the CSS file

const handleBackToHome = () => {
  window.location.href = '/FrontendDMS/home';
}

const Forbidden = () => {
  return (
    <div className="forbidden-container">
      <h1 className="forbidden-number">403</h1>
      <p className="forbidden-message">Forbidden Access</p>
      <button className='forbidden-back-to-home' onClick={handleBackToHome}>Back to Home</button>
    </div>
  );
};

export default Forbidden;
