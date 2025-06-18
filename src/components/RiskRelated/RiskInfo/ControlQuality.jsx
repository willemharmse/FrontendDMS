

import React, { useState, useEffect } from "react";
import "./ControlQuality.css"; // Add styling here

const ControlQuality = ({ setClose }) => {
    return (
        <div className="popup-overlay-qual">
            <div className="popup-content-qual">
                <div className="review-date-header">
                    <h2 className="review-date-title">Control Quality</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="qual-table-group">
                    <div className="popup-table-wrapper-qual">
                        <p className="qual-image-label qual-image-label--top">
                            Quality is a measure of how well the control has been designed, considering:
                        </p>

                        <img
                            src={`${process.env.PUBLIC_URL}/InfoPopup2.png`}
                            alt="Info popup diagram"
                            className="qual-image"
                        />

                        <p style={{ marginBottom: "0px" }}>
                            Note: A control’s quality must be rated according to its functionality. When rating the quality, do not concider the site’s compliance to the control
                        </p>
                    </div>
                </div>

                <div className="qual-table-group-2">
                    <table className="popup-table haznt-fam">
                        <thead className="qual-headers">
                            <tr>
                                <th className="inp-size-qual">Quality Rating</th>
                                <th className="desc-size-qual">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: "bold", backgroundColor: "#7EAC87", textAlign: "center" }}>
                                    {'>'}90%
                                </td>
                                <td>
                                    Control will operate, survive, and function as required 90% or more of the time.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold", backgroundColor: "#FFFF89", textAlign: "center" }}>
                                    60 – 90%
                                </td>
                                <td>
                                    Control will operate, survive, and function as required 60 to 90% of the time.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold", backgroundColor: "#FFC000", textAlign: "center" }}>
                                    30 – 59%
                                </td>
                                <td>
                                    Control will operate, survive, and function as required 30 to 59% of the time.
                                </td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold", backgroundColor: "#CB6F6F", textAlign: "center" }}>
                                    {'<'}30%
                                </td>
                                <td>
                                    Control will operate, survive, and function as required less than 30% of the time.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
};

export default ControlQuality;