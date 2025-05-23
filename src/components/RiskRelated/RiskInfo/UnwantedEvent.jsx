

import React, { useState, useEffect } from "react";
import "./UnwantedEvent.css"; // Add styling here

const UnwantedEvent = ({ setClose }) => {
    return (
        <div className="popup-overlay-ue">
            <div className="popup-content-ue">
                <div className="review-date-header">
                    <h2 className="review-date-title">Unwanted Event (UE)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="ue-table-group-2">
                    <div className="popup-table-wrapper-ue-2">
                        <p>
                            As far as reasonably practicable the unwanted event must be written in such a way as not to pre-empt the consequences or impact of the unwanted event.
                        </p>
                        <p>
                            <strong>Example of incorrect unwanted event:</strong> Loss of life due to vehicle collision. This approach will limit the thinking of the workshop team to focus on a specific outcome or consequence such as Safety only. All consequence types should be considered in the formulation of the unwanted event.
                        </p>
                        <p>
                            <strong>Example of correct unwanted event:</strong> Vehicle collision. As far as reasonably practicable the unwanted events must not be written to include a specific cause related to the unwanted event.
                        </p>
                    </div>
                </div>

                <div className="ue-table-group">
                    <div className="popup-table-wrapper-ue">
                        <table className="popup-table haznt-fam">
                            <thead className="ue-headers">
                                <tr>
                                    <th className="inp-size-ue">Term</th>
                                    <th className="desc-size-ue">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Dangerous occurrence
                                    </td>
                                    <td>
                                        Refers to any occurrence at a mine that could have caused serious harm or damage, even if it did not.
                                        <br />Source: MHSA Guideline for Mandatory Codes of Practice on Risk-Based Assessments (Issued by the Chief Inspector of Mines).

                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Unwanted Event
                                    </td>
                                    <td>
                                        A key point in a scenario at which a hazard is realized, often resulting in injury, damage, or loss.
                                        <br />Source: MHSC Risk Assessment Frameworks (e.g. FOGRA or MOSH).
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

export default UnwantedEvent;