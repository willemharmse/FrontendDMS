

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
                            <strong>Purpose:</strong>
                            <br />To define the overall intent and desired outcome of the RA. It confirms why the RA is being conducted. This assists the team to align their thinking before identifying hazards or rating the risks.
                        </p>
                        <p>
                            <strong>Guiding Questions:</strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li>What is the goal of this RA?</li>
                                <li>What are the key outcomes, objectives or issues this RA aims to address?</li>
                            </ul>
                        </p>
                        <p>
                            <strong>Example Text: </strong><br />
                            The aim of this risk assessment is to identify and evaluate risks associated with <strong><span className="underline">routine maintenance of conveyor belt systems in the crushing plant</span></strong>. This is to ensure that energy isolation, guarding, and entrapment risks are adequately controlled.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default RiskAim;