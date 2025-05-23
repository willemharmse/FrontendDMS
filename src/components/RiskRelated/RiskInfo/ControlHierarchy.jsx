import React, { useState, useEffect } from "react";
import "./ControlHierarchy.css"; // Add styling here

const ControlHierarchy = ({ setClose }) => {
    return (
        <div className="popup-overlay-control-hier">
            <div className="popup-content-control-hier">
                <div className="review-date-header">
                    <h2 className="review-date-title">Hierarchy of Controls</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="control-hier-table-group">
                    <div className="popup-table-wrapper-control-hier">
                        <table className="popup-table font-fam">
                            <thead className="control-hier-headers">
                                <tr>
                                    <th className="inp-size-control-hier">Control Type</th>
                                    <th className="desc-size-control-hier">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Elimination
                                    </td>
                                    <td>
                                        Complete elimination of the hazard by design.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Substitution
                                    </td>
                                    <td>
                                        Replacing the hazard, material or process with a less hazardous one, or significantly reducing the magnitude of the hazard or material so consequences are greatly reduced.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Engineering
                                    </td>
                                    <td>
                                        Design in controls or redesign the equipment or work process.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Separation
                                    </td>
                                    <td>
                                        Placing a physical barrier on the hazard by guarding or enclosing it.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Administration
                                    </td>
                                    <td>
                                        Providing control such as training and procedures (Dependent on human reaction).
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        PPE
                                    </td>
                                    <td>
                                        Use of appropriate and properly fitted Personal Protective Equipment where other controls are not practical.
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

export default ControlHierarchy;