
import React, { useState, useEffect } from "react";
import "./CurrentControlsJRA.css"; // Add styling here

const CurrentControlsJRA = ({ setClose }) => {
    return (
        <div className="popup-overlay-controlCurrent">
            <div className="popup-content-controlCurrent">
                <div className="review-date-header">
                    <h2 className="review-date-title">Current Control</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="cc-table-group-2">
                    <div className="popup-table-wrapper-cc-2">
                        <p>

                            When selecting a sub-task or control from the dropdown list, please exercise caution to ensure that the original meaning and context are not altered. The items in the dropdown menu have been pre-approved by a competent person, and any changes could compromise the accuracy or integrity of the assessment.
                        </p>
                    </div>
                </div>

                <div className="controlCurrent-table-group">
                    <div className="popup-table-wrapper-controlCurrent">
                        <table className="popup-table haznt-fam">
                            <thead className="controlCurrent-headers">
                                <tr>
                                    <th className="inp-size-controlCurrent">Term</th>
                                    <th className="desc-size-controlCurrent">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Control
                                    </td>
                                    <td>
                                        A control is defined as an act, object (engineered) or system (combination of act and object) intended to prevent or mitigate an unwanted event.
                                        <br /><span className="itals-help-info">Source: International Council on Mining and Metals (ICMM) Critical Control Management (CCM) Implementation Guide.</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default CurrentControlsJRA;