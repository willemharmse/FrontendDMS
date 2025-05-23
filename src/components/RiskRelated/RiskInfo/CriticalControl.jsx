

import React, { useState, useEffect } from "react";
import "./CriticalControl.css"; // Add styling here

const CriticalControl = ({ setClose }) => {
    return (
        <div className="popup-overlay-crit">
            <div className="popup-content-crit">
                <div className="review-date-header">
                    <h2 className="review-date-title">Critical Control</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="crit-scrollable">
                    <div className="crit-popup-page-additional-row">
                        <div className="crit-table-group-half-1">
                            <div className="popup-table-wrapper-crit-2">
                                <p>
                                    Critical Controls are controls that are crucial to preventing, or mitigating the consequences of, an MUE.

                                </p>
                                <p>
                                    The absence or failure of a critical control will significantly increase the risk of an MUE occurring, despite the existence of the other controls.
                                </p>
                            </div>
                        </div>

                        <div className="crit-table-group-half-2">
                            <div className="popup-table-wrapper-crit-2">
                                <table className="popup-table haznt-fam">
                                    <thead className="crit-headers">
                                        <tr>
                                            <th className="inp-size-crit">Term</th>
                                            <th className="desc-size-crit">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ height: "5px" }}>
                                            <td style={{ fontWeight: "bold" }}>
                                                Control
                                            </td>
                                            <td>
                                                A control is defined as an act, object (engineered) or system (combination of act and object) intended to prevent or mitigate an unwanted event.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>
                                                Critical Control
                                            </td>
                                            <td>
                                                Those controls that significantly influence the likelihood and/or critequence of an event (if removed, they will significantly impact the risk rating).
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="crit-table-group crit-image-wrapper">
                        <p className="crit-image-label crit-image-label--top">
                            Control and Critical Control Path Flow Chart
                        </p>

                        <img
                            src={`${process.env.PUBLIC_URL}/InfoPopup1.png`}
                            alt="Info popup diagram"
                            className="crit-image"
                        />

                        <p className="crit-image-label-2">
                            Source: International Council on Mining and Metals (ICMM) Critical Control Management (CCM) Implementation Guide.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default CriticalControl;