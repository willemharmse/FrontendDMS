
import React, { useState, useEffect } from "react";
import "./PriorityUE.css"; // Add styling here

const PriorityUE = ({ setClose }) => {
    return (
        <div className="popup-overlay-pue">
            <div className="popup-content-pue">
                <div className="review-date-header">
                    <h2 className="review-date-title">Priority Unwanted Event (PUE)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="pue-table-group">
                    <div className="popup-table-wrapper-pue">
                        <table className="popup-table font-fam">
                            <thead className="pue-headers">
                                <tr>
                                    <th className="inp-size-pue">Term</th>
                                    <th className="desc-size-pue">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Priority Unwanted Event
                                    </td>
                                    <td>
                                        A priority unwanted event is an unwanted event that, due to its potential to cause multiple fatalities, major injuries, or significant operational or environmental impact, is prioritized for detailed analysis and control.
                                        <br /><span className="itals-help-info">Source: MHSC Guideline for the Compilation of a Mandatory COP for Risk-Based Assessments</span>
                                        <br />
                                        <br />A PUE is any event with a maximum consequence rating of either 4 or 5 (high and major) on the Anglo-American Operational Risk Management risk matrix.
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

export default PriorityUE;