

import React, { useState, useEffect } from "react";
import "./Go_Nogo.css"; // Add styling here

const Go_Nogo = ({ setClose }) => {
    return (
        <div className="popup-overlay-gng">
            <div className="popup-content-gng">
                <div className="review-date-header">
                    <h2 className="review-date-title">Go/ No Go</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="gng-table-group-2">
                    <div className="popup-table-wrapper-gng-2">
                        <p style={{ marginBottom: "5px" }}>
                            The <strong>Go/ No-Go</strong> column must be marked with an 'X' if one or both of the following is true:
                        </p>
                        <p style={{ marginTop: "0px" }}>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "0px" }}>
                                <li>If it is linked to a PUE (Priority Unwanted Event).</li>
                                <li>If the task cannot proceed unless the WED (Work Execution Document) question is marked as compliant during execution and/ or PTO Assessment.</li>
                            </ul>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Go_Nogo;