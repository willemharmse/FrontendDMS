
import React, { useState, useEffect } from "react";
import "./MaterialUE.css"; // Add styling here

const MaterialUE = ({ setClose }) => {
    return (
        <div className="popup-overlay-mue">
            <div className="popup-content-mue">
                <div className="review-date-header">
                    <h2 className="review-date-title">Material Unwanted Event (MUE)</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="mue-table-group">
                    <div className="popup-table-wrapper-mue">
                        <table className="popup-table font-fam">
                            <thead className="mue-headers">
                                <tr>
                                    <th className="inp-size-mue">Term</th>
                                    <th className="desc-size-mue">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Material Unwanted Event
                                    </td>
                                    <td>
                                        A material unwanted event is a rare but potentially catastrophic event.
                                        <br /><br />
                                        Mining industry examples of MUEs include underground fires, coaldust explosions and over exposure to diesel particulate matter. Not all MUEs involve sudden events.
                                        <br /><br />
                                        For example, MUEs may also include the potential exposure of groups of workers to carcinogenic or other agent at harmful levels over a protracted period. These all have the potential to cause multiple casualties, but they can also affect the ongoing viability of a business. In other words, they present a material risk to the business.
                                        <br /> <br />
                                        Prevention of MUEs requires specific attention at the highest level of an organisation alongside other material business risks.
                                        <br /><br />
                                        <span className="itals-help-info">Source: International Council on Mining and Metals (ICMM) Critical Control Management (CCM) Implementation Guide.
                                        </span>
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

export default MaterialUE;