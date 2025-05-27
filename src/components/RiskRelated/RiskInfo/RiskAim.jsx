

import React, { useState, useEffect } from "react";
import "./RiskAim.css"; // Add styling here

const RiskAim = ({ setClose }) => {
    return (
        <div className="popup-overlay-aim">
            <div className="popup-content-aim">
                <div className="review-date-header">
                    <h2 className="review-date-title">Aim of the Risk Assessment (RA)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="aim-table-group-2">
                    <div className="popup-table-wrapper-aim-2">
                        <p>
                            <strong>Purpose:</strong> To define the overall intent and desired outcome of the RA.
                            <br />
                        </p>
                        <p>
                            <strong>Aim </strong>= Why we are doing this RA? <br />
                            This helps teams align their thinking before they start identifying hazards or rating risks.
                            <br />
                        </p>
                        <p>
                            <strong>Guiding Questions:</strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li>What is the goal of this RA?</li>
                                <li>What are the key outcomes, objectives or issues this RA aims to address?</li>
                            </ul>
                        </p>
                        <p>
                            <strong>Example Text: </strong>The aim of this risk assessment is to identify and evaluate potential Priority Unwanted Events (PUEs) and Material Unwanted Events (MUEs) related to underground drilling operations, and to ensure appropriate controls are in place to reduce the risk of injury, equipment damage, or production delays.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default RiskAim;