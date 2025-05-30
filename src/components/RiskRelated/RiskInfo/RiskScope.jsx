

import React, { useState, useEffect } from "react";
import "./RiskScope.css"; // Add styling here

const RiskScope = ({ setClose }) => {
    return (
        <div className="popup-overlay-scope">
            <div className="popup-content-scope">
                <div className="review-date-header">
                    <h2 className="review-date-title">Scope of the Risk Assessment (RA)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="scope-table-group-2">
                    <div className="popup-table-wrapper-scope-2">
                        <p>
                            <strong>Purpose:</strong>
                            <br />To define the boundaries of the risk assessment, including what is covered and what is not. A clear scope prevents misunderstandings, keeps the assessment focused, and ensures context-relevant analysis discussions.
                        </p>
                        <p>
                            <strong>Guiding Questions:</strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li>What areas, processes, equipment, teams, or time periods are included in this risk assessment?</li>
                                <li>Are there any specific exclusions worthy of mention, and why (if applicable)?</li>
                                <li>Are there any assumptions or limits to be aware of?</li>
                            </ul>
                        </p>
                        <p>
                            <strong>Example Text: </strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li><strong>Scope Inclusions: </strong><br />
                                    <ul>
                                        <li>                                   Maintenance tasks on the crushing plant conveyor systems, including belt inspections, roller replacements, tension adjustments, and cleaning procedures.</li>
                                    </ul>
                                </li>
                                <li><strong>Scope Exclusions: </strong><br />
                                    <ul>
                                        <li>Conveyor systems in the milling or stockpile areas - these are assessed under a separate RA for those zones.</li>
                                        <li>Emergency or breakdown maintenance conducted during live operations - these are not considered part of routine maintenance.</li>
                                    </ul>
                                </li>
                            </ul>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default RiskScope;