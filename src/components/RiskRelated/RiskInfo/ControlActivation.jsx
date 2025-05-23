import React, { useState, useEffect } from "react";
import "./ControlActivation.css"; // Add styling here

const ControlActivation = ({ setClose }) => {
    return (
        <div className="popup-overlay-control-activation">
            <div className="popup-content-control-activation">
                <div className="review-date-header">
                    <h2 className="review-date-title">Control Activation (Pre or Post Unwanted Event)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="control-activation-table-group">
                    <div className="popup-table-wrapper-control-activation">
                        <table className="popup-table font-fam">
                            <thead className="control-activation-headers">
                                <tr>
                                    <th className="inp-size-control-activation">Term</th>
                                    <th className="desc-size-control-activation">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Prevention Control
                                    </td>
                                    <td>
                                        Preventive controls act to either prevent the causes occurring or, if they do, to not result in a loss of control i.e. the unwanted event.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Mitigating Control
                                    </td>
                                    <td>
                                        Mitigating controls make sure that if the unwanted event occurs, it does not result in the consequences and/or they mitigate the impact.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <label className="control-activation-label-help">Source: Commissioner for Resource Safety & Health: Risk Assessment Education Resource - Mining Safety and Health Advisory Committee
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default ControlActivation;