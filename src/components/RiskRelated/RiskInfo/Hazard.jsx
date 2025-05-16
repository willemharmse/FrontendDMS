
import React, { useState, useEffect } from "react";
import "./Hazard.css"; // Add styling here

const Hazard = ({ setClose }) => {
    return (
        <div className="popup-overlay-haz">
            <div className="popup-content-haz">
                <div className="review-date-header">
                    <h2 className="review-date-title">Hazard</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="haz-table-group">
                    <div className="popup-table-wrapper-haz">
                        <table className="popup-table haznt-fam">
                            <thead className="haz-headers">
                                <tr>
                                    <th className="inp-size-haz">Term</th>
                                    <th className="desc-size-haz">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Hazard
                                    </td>
                                    <td>
                                        A hazard is any condition, event, or circumstance that could lead to or contribute to an unplanned or undesirable event in a mining environment.
                                        <br />Source: Mine Health and Safety Council (MHSC), South Africa
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

export default Hazard;