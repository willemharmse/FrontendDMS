
import React, { useState, useEffect } from "react";
import "./MaxConsequence.css"; // Add styling here

const MaxConsequence = ({ setClose }) => {
    return (
        <div className="popup-overlay-MaxConsequence">
            <div className="popup-content-MaxConsequence">
                <div className="review-date-header">
                    <h2 className="review-date-title">Maximum Reasonable Consequence Description</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="MaxConsequence-table-group">
                    <div className="popup-table-wrapper-MaxConsequence">
                        <table className="popup-table haznt-fam">
                            <thead className="MaxConsequence-headers">
                                <tr>
                                    <th className="inp-size-MaxConsequence">Term</th>
                                    <th className="desc-size-MaxConsequence">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Maximum Reasonable Consequence
                                    </td>
                                    <td>
                                        The largest realistic or credible of an event, or the worst-case consequence that could reasonably be expected, given the scenario and based upon past experience.
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

export default MaxConsequence;