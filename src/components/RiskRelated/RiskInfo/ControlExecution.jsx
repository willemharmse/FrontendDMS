

import React, { useState, useEffect } from "react";
import "./ControlExecution.css"; // Add styling here

const ControlExecution = ({ setClose }) => {
    return (
        <div className="popup-overlay-ce">
            <div className="popup-content-ce">
                <div className="review-date-header">
                    <h2 className="review-date-title">Control Execution Specification (For Work Execution Document [WED])</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="ce-table-group-2">
                    <div className="popup-table-wrapper-ce-2">
                        <p>
                            The WED questions are meant to serve as a check to ensure that all controls or sub task steps have been implemented safely and according to standard. The items in this column are AI-generated; once generated, the user can edit the item and has the option to have the AI rewrite it to ensure correct grammar and spelling.
                        </p>
                        <p>
                            <strong>Examples:</strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li>If a control is <strong>“Wear the appropriate PPE”</strong>, the accompanying WED question must read as follows: <strong>“Have I worn the appropriate PPE?”</strong>.</li>
                                <li>If the sub task step is <strong>“Clean the spillage under the head pulley scraper area with a shovel”</strong>, the accompanying WED question must read as follows: <strong>“Have I cleaned the spillage under the head pulley scraper area with a shovel?”</strong>.</li>
                            </ul>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default ControlExecution;