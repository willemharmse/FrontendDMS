

import React, { useState, useEffect } from "react";
import "./RiskTreatment.css"; // Add styling here

const RiskTreatment = ({ setClose }) => {
    return (
        <div className="popup-overlay-rt">
            <div className="popup-content-rt">
                <div className="review-date-header">
                    <h2 className="review-date-title">Risk Treatment (Possible Improvements and Actions)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="rt-table-group-2">
                    <div className="popup-table-wrapper-rt-2">
                        <p>
                            “A risk is considered adequately dealt with when appropriate controls are in place and maintained to reduce the risk to a level that is as low as reasonably practicable (ALARP)."
                            <br />Source: MHSC – Guideline for the Compilation of a Mandatory Code of Practice on Risk-Based Assessments
                        </p>
                        <p>
                            MHSA Section 11(2) states that employers must ensure that "every significant risk is either eliminated, controlled, or minimized to the extent reasonably practicable.”
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default RiskTreatment;