
import React, { useState, useEffect } from "react";
import "./CurrentControls.css"; // Add styling here

const CurrentControls = ({ setClose }) => {
    return (
        <div className="popup-overlay-controlCurrent">
            <div className="popup-content-controlCurrent">
                <div className="review-date-header">
                    <h2 className="review-date-title">Current Control</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
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
                                        <br />Source: International Council on Mining and Metals (ICMM) Critical Control Management (CCM) Implementation Guide.
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

export default CurrentControls;