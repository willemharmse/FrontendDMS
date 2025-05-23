
import React, { useState, useEffect } from "react";
import "./LikelihoodHelp.css"; // Add styling here

const LikelihoodHelp = ({ setClose }) => {
    return (
        <div className="popup-overlay-LikelihoodHelp">
            <div className="popup-content-LikelihoodHelp">
                <div className="review-date-header">
                    <h2 className="review-date-title">Likelihood of Event</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="LikelihoodHelp-table-group">
                    <div className="popup-table-wrapper-LikelihoodHelp">
                        <table className="popup-table haznt-fam">
                            <thead className="LikelihoodHelp-headers">
                                <tr>
                                    <th className="inp-size-LikelihoodHelp">Likelihood</th>
                                    <th className="num-size-LikelihoodHelp">Number</th>
                                    <th className="desc-size-LikelihoodHelp">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Almost certain
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        5
                                    </td>
                                    <td>
                                        The unwanted event is almost certain to happen within the LOB (Life of Business). In the case of repetitive/frequent tasks the unwanted event has or will occur in order of one or more times per year. In terms of major events, also in the case of long-term health, environmental or social impacts it may happen once in the company’s existence.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Likely
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        4
                                    </td>
                                    <td>
                                        There is a high probability that the unwanted event will occur within the LOB.  In the case of repetitive/frequent tasks the unwanted event has or will occur in order of less than once per year.  In terms of major events, also in the case of long-term health, environmental or social impacts. It may happen once in the company’s existence.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Possible
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        3
                                    </td>
                                    <td>
                                        It is possible that the unwanted event can occur within the LOB.  In the case of repetitive/frequent tasks the unwanted event has or will occur in order of once every 5 -10 years.  In terms of major events, also in the case of long-term health, environmental or social impacts it may possibly happen once in the LOB.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Unlikely
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        2
                                    </td>
                                    <td>
                                        There is a low probability that the unwanted event will occur within the company’s existence.  In the case of repetitive/frequent tasks the unwanted event has or will occur in order of once every 10-20 years.  In terms of major events, also in the case of long-term health, environmental or social impacts, there is low probability for the event to ever happen.
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        Rare
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        1
                                    </td>
                                    <td>
                                        There is a very low probability for the unwanted event to occur within the company’s existence.  In the case of repetitive/frequent tasks there are no records of the event occurring or it is highly unlikely that it will occur within the next 20 years. In terms of major events, also in the case of long-term health, environmental or social impacts there is very low probability for the event to ever happen.
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

export default LikelihoodHelp;