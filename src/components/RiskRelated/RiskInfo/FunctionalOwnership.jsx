import React, { useState, useEffect } from "react";
import "./FunctionalOwnership.css"; // Add styling here

const FunctionalOwnership = ({ setClose }) => {
    return (
        <div className="popup-overlay-fo">
            <div className="popup-content-fo">
                <div className="review-date-header">
                    <h2 className="review-date-title">Functional Ownership</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="fo-table-group">
                    <div className="popup-table-wrapper-fo">
                        <table className="popup-table font-fam">
                            <thead className="fo-headers">
                                <tr>
                                    <th className="inp-size-fo">Term</th>
                                    <th className="desc-size-fo">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Functional Ownership
                                    </td>
                                    <td>
                                        Refers to the functional department responsible for managing the risk.
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

export default FunctionalOwnership;