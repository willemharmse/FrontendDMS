import React, { useState, useEffect } from "react";
import "./ControlDesc.css"; // Add styling here

const ControlDesc = ({ setClose, description, performance }) => {
    return (
        <div className="popup-overlay-haz">
            <div className="popup-content-haz">
                <div className="review-date-header">
                    <h2 className="review-date-title">Control Description</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="controlDesc-table-group">
                    <label className="controlDesc-header">Control Description</label>
                    <span className="controlDesc-text">
                        {description}
                    </span>
                </div>
                <div className="controlDesc-table-group">
                    <label className="controlDesc-header">Control Performance Requirements</label>
                    <span className="controlDesc-text">
                        {performance}
                    </span>
                </div>
            </div>
        </div>
    )
};

export default ControlDesc;