

import React, { useState, useEffect } from "react";
import "./ExecutiveSummaryInfo.css"; // Add styling here

const ExecutiveSummaryInfo = ({ setClose }) => {
    return (
        <div className="popup-overlay-exec">
            <div className="popup-content-exec">
                <div className="review-date-header">
                    <h2 className="review-date-title">Executive Summary</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="exec-table-group-2">
                    <div className="popup-table-wrapper-exec-2">
                        <p>
                            Use this section to write a focused summary of the key outcomes from the risk assessment. The goal is to give a quick, insightful snapshot of the risk profile to help decision-makers understand the critical issues at a glance.
                            <br />
                        </p>
                        <p>
                            Focus on summarising what these risks are, why they are critical, and any patterns or trends observed.
                            <br />
                        </p>
                        <p>
                            <strong>Guiding Questions:</strong>
                            <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginTop: "2px" }}>
                                <li>Are there any common causes or themes across the high-rated UEs?</li>
                                <li>What types of consequences are most concerning?</li>
                                <li>Do any of the risks pose immediate threats or require urgent attention?</li>
                                <li>Is there anything unusual or unexpected in the results?</li>
                            </ul>
                        </p>
                        <p>
                            To assist you, the app will generate a draft summary based on the information captured during the risk assessment. You can then review, refine, and expand on it to create your final Executive Summary.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default ExecutiveSummaryInfo;