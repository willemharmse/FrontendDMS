// src/components/NotFound.js
import React from 'react';
import './NotFound.css'; // Import the CSS file

const handleBackToHome = () => {
  window.location.href = 'FrontendDMS/home';
}

const NotFound = () => {
  return (
    <div className="notfound-container">
      <h1 className="notfound-number">404</h1>
      <p className="notfound-message">Page Not Found</p>
      <button className='forbidden-back-to-home' onClick={handleBackToHome}>Back to Home</button>
    </div>
  );
};

export default NotFound;
