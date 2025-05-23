import React, { useState, useEffect } from "react";
import "./ControlType.css"; // Add styling here

const ControlType = ({ setClose }) => {
    return (
        <div className="popup-overlay-control-type">
            <div className="popup-content-control-type">
                <div className="review-date-header">
                    <h2 className="review-date-title">Act, Object or System</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="control-type-table-group">
                    <div className="popup-table-wrapper-control-type">
                        <table className="popup-table font-fam">
                            <thead className="control-type-headers">
                                <tr>
                                    <th className="inp-size-control-type">Term</th>
                                    <th className="desc-size-control-type">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Act
                                    </td>
                                    <td>
                                        This refers to a specific action taken by an individual or a group of individuals to prevent a hazard or mitigate its consequences. Examples include following safety procedures, using equipment correctly, or providing appropriate training.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Object
                                    </td>
                                    <td>
                                        This refers to a physical item, tool, or piece of equipment that is used to control a hazard. Examples include safety barriers, warning signs, or personal protective equipment (PPE).
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        System
                                    </td>
                                    <td>
                                        This refers to a broader set of procedures, policies, or technologies that are implemented to manage risks. Examples include emergency response systems, ventilation systems, or automated safety checks.
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

export default ControlType;