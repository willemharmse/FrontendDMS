// MaxRiskRank.jsx
import React from 'react';
import './MaxRiskRank.css';

const MaxRiskRank = ({ setClose }) => (
    <div className="popup-overlay-MaxRiskRank">
        <div className="popup-content-MaxRiskRank">
            {/* — Header — */}
            <div className="review-date-header">
                <h2 className="review-date-title">Maximum Reasonable Consequence Description</h2>
                <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
            </div>

            {/* — Boxed group contains subtitle, table & notes — */}
            <div className="MaxRiskRank-group">
                <div className="MaxRiskRank-subtitle">
                    5X5 Semi-Quantitative Risk Matrix
                </div>

                <div className="popup-table-wrapper-MaxRiskRank">
                    <table className="matrix-table-MaxRiskRank">
                        <thead>
                            <th colSpan={7} style={{ textAlign: "center" }}>Consequence</th>
                            <tr>
                                <th className="corner-cell-MaxRiskRank" style={{ border: "0px" }}></th>
                                <th className="corner-cell-MaxRiskRank"></th>
                                <th>1: Insignificant</th>
                                <th>2: Minor</th>
                                <th>3: Moderate</th>
                                <th>4: High</th>
                                <th>5: Major</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td rowSpan={5} className="vertical-header-MaxRiskRank" style={{ backgroundColor: "#002060", color: "white", borderTop: "1px #002060 solid" }}>Likelihood</td>
                                <th>5: Almost certain</th>
                                <td className="medium">Medium (11)</td>
                                <td className="significant">Significant (16)</td>
                                <td className="significant">Significant (20)</td>
                                <td className="high">High (23)</td>
                                <td className="high">High (25)</td>
                            </tr>
                            <tr>
                                <th>4: Likely</th>
                                <td className="medium">Medium (7)</td>
                                <td className="medium">Medium (12)</td>
                                <td className="significant">Significant (17)</td>
                                <td className="high">High (21)</td>
                                <td className="high">High (24)</td>
                            </tr>
                            <tr>
                                <th>3: Possible</th>
                                <td className="low">Low (4)</td>
                                <td className="medium">Medium (8)</td>
                                <td className="significant">Significant (13)</td>
                                <td className="significant">Significant (18)</td>
                                <td className="high">High (22)</td>
                            </tr>
                            <tr>
                                <th>2: Unlikely</th>
                                <td className="low">Low (2)</td>
                                <td className="low">Low (5)</td>
                                <td className="medium">Medium (9)</td>
                                <td className="significant">Significant (14)</td>
                                <td className="significant">Significant (19)</td>
                            </tr>
                            <tr>
                                <th>1: Rare</th>
                                <td className="low">Low (1)</td>
                                <td className="low">Low (3)</td>
                                <td className="medium">Medium (6)</td>
                                <td className="medium">Medium (10)</td>
                                <td className="significant">Significant (15)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="matrix-notes-MaxRiskRank">
                    <p><strong>5x5 Risk Matrix and Likelihood and Consequence Tables:</strong></p>
                    <ul>
                        <li>Risk rating does not indicate risk acceptability; all risks should be reduced to ALARP (As low as reasonably practicable).</li>
                        <li>Items rated as “significant” or “high” are an immediate indicator that the risk is not tolerable and additional controls need to be implemented to reduce the risk to ALARP.</li>
                        <li>Items rated as “Medium” or “low” are tolerable risk, although measures should be implemented to ensure that the risk can be reduced to ALARP.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default MaxRiskRank;
