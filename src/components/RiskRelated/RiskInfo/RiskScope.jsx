

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
                            <strong>Purpose:</strong> To define the boundaries of the RA, including what is covered and what is not.
                            <br />
                        </p>
                        <p>
                            <strong>Scope </strong>= What is being covered (and what is not)?<br />
                            This helps teams align their thinking before they start identifying hazards or rating risks.
                            <br />
                        </p>
                        <p>
                            <strong>Guiding Questions:</strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li>What areas, processes, equipment, teams, or time periods are included in this RA?</li>
                                <li>What areas or elements are not included (if applicable)?</li>
                                <li>Are there any assumptions or limits to be aware of?</li>
                            </ul>
                        </p>
                        <p>
                            <strong>Example Text: </strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li><strong>Scope Inclusions: </strong>This RA covers all drilling activities performed in Section 14E during the Q2 production cycle. It includes operator interfaces, drilling equipment, ventilation, and nearby ground support.</li>
                                <li><strong>Scope Exclusions: </strong>It excludes explosives handling and surface transport logistics, which are assessed separately.</li>
                            </ul>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default RiskScope;