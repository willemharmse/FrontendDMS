import React, { useState, useEffect } from "react";
import "./InfoPopupDash.css"; // Add styling here

const InfoPopupDash = ({ title, text, setClose }) => {
    return (
        <div className="dashInfo-overlay">
            <div className="dashInfo-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">{title}</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="dashInfo-body">
                    <p className="dashInfo-text">Placeholder info for {title}</p>
                </div>
            </div>
        </div>
    );
};

export default InfoPopupDash;