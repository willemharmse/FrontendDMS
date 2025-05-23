

import React, { useState, useEffect } from "react";
import "./ConsequenceRating.css"; // Add styling here

const ConsequenceRating = ({ setClose }) => {
    return (
        <div className="popup-overlay-cons">
            <div className="popup-content-cons">
                <div className="review-date-header">
                    <h2 className="review-date-title">Consequence Rating</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="cons-scrollable">
                    <div className="cons-popup-page-additional-row">
                        <div className="cons-table-group-half-1">
                            <div className="popup-table-wrapper-cons-2">
                                <p>
                                    The Consequence is an assessment of the outcome(s) that could result if an unwanted event occurs.
                                </p>
                                <p>
                                    The <strong>maximum reasonable consequence</strong> of the unwanted event should be considered. This requires that the hazard or energy be examined to establish what would be the <strong>maximum reasonable outcome</strong> should the unwanted event materialise.
                                </p>
                                <p>
                                    There are <strong>seven (7) types of loss or impact categories </strong>for an unwanted event, each with five (5) levels of consequence ranging from “Insignificant” to “Major”.
                                </p>
                            </div>
                        </div>

                        <div className="cons-table-group-half-2">
                            <div className="popup-table-wrapper-cons-2">
                                <table className="popup-table haznt-fam">
                                    <thead className="cons-headers">
                                        <tr>
                                            <th className="inp-size-cons">Abbreviation</th>
                                            <th className="desc-size-cons">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ height: "5px" }}>
                                            <td style={{ fontWeight: "bold" }}>
                                                S
                                            </td>
                                            <td>
                                                Safety - Harm to People
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>
                                                H
                                            </td>
                                            <td>
                                                Occupational Health - Harm to People
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>
                                                E
                                            </td>
                                            <td>
                                                Environmental Impact
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>
                                                C
                                            </td>
                                            <td>
                                                Community/ Social
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>
                                                L & R
                                            </td>
                                            <td>
                                                Legal & Regulatory
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>
                                                M
                                            </td>
                                            <td>
                                                Material/ Financial Losses
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>
                                                R
                                            </td>
                                            <td>
                                                Impact on Reputation
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="cons-table-group">
                        <table className="matrix-table-cons">
                            <thead>
                                <th colSpan={7} style={{ textAlign: "center" }} className="matrix-top-row">Consequence Level</th>
                                <tr>
                                    <th className="corner-cell-cons" style={{ border: "0px", backgroundColor: "#002060" }}></th>
                                    <th className="corner-cell-cons"></th>
                                    <th>1: Insignificant</th>
                                    <th>2: Minor</th>
                                    <th>3: Moderate</th>
                                    <th>4: High</th>
                                    <th>5: Major</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td rowSpan={7} className="vertical-header-cons" style={{ backgroundColor: "#002060", color: "white", borderTop: "1px #002060 solid" }}>Impact Type</td>
                                    <th>(S) Harm to People-Safety</th>
                                    <td >First aid case</td>
                                    <td >Medical treatment case</td>
                                    <td >Lost time injury</td>
                                    <td >Permanent disability or single fatality</td>
                                    <td >Numerous permanent disabilities or multiple fatalities</td>
                                </tr>
                                <tr>
                                    <th>(H) Harm to People- Occupational Health</th>
                                    <td >Exposure to health hazard resulting in temporary discomfort
                                    </td>
                                    <td >Exposure to health hazard resulting in symptoms requiring medical intervention and full recovery (no lost time)
                                    </td>
                                    <td >Exposure to health hazards/ agents (over the OEL) resulting in reversible impact on health (with lost time) or permanent change with no disability or loss of quality of life
                                    </td>
                                    <td >Exposure to health hazards/ agents (significantly over the OEL) resulting in irreversible impact on health with loss of quality of life or single fatality
                                    </td>
                                    <td >Exposure to health hazards/ agents (significantly over the OEL) resulting in irreversible impact on health with loss of quality of life of a numerous group/population or multiple fatalities
                                    </td>
                                </tr>
                                <tr>
                                    <th>(E) Environmental Impact</th>
                                    <td >Lasting days or less; limited to small area (metres); receptor of low significance/ sensitivity (industrial area)
                                    </td>
                                    <td >Lasting weeks; reduced area (hundreds of metres); no environmentally sensitive species/ habitat)
                                    </td>
                                    <td >Lasting months; impact on an extended area (kilometres); area with some environmental sensitivity (scarce/ valuable environment).
                                    </td>
                                    <td >Lasting years; impact on sub-basin; environmentally sensitive environment/ receptor (endangered species/ habitats)
                                    </td>
                                    <td >Permanent impact; affects a whole basin or region; highly sensitive environment (endangered species, wetlands, protected habitats)
                                    </td>
                                </tr>
                                <tr>
                                    <th>(C) Social / Community</th>
                                    <td >Minor disturbance of culture/ social structures
                                    </td>
                                    <td >Some impacts on local population, mostly repairable. Single stakeholder complaint in reporting period
                                    </td>
                                    <td >On going social issues. Isolated complaints from community members/ stakeholders
                                    </td>
                                    <td >Significant social impacts. Organized community protests threatening continuity of operations
                                    </td>
                                    <td >Major widespread social impacts. Community reaction affecting business continuity. “License to operate” under jeopardy
                                    </td>
                                </tr>
                                <tr>
                                    <th>(L&R) Legal & Regulatory</th>
                                    <td >Technical non-compliance. No warning received; no regulatory reporting required
                                    </td>
                                    <td >Breach of regulatory requirements; report/involvement of authority. Attracts administrative fine
                                    </td>
                                    <td >Minor breach of law; report/investigation by authority. Attracts compensation/ penalties/ enforcement action
                                    </td>
                                    <td >Breach of the law; may attract criminal prosecution, penalties/ enforcement action. Individual licence temporarily revoked
                                    </td>
                                    <td >Significant breach of the law. Individual or company lawsuits; permit to operate substantially modified or withdrawn
                                    </td>
                                </tr>
                                <tr>
                                    <th>(M) Material/Financial Losses/ Damage/ Interruption</th>
                                    <td > {'<'} 1 % of Annual Revenue / Total Assets</td>
                                    <td >{'<'}2 % of Annual Revenue / Total Assets
                                    </td>
                                    <td >{'<'}5% of Annual Revenue / Total Assets
                                    </td>
                                    <td >{'<'}15% of Annual Revenue / Total Assets
                                    </td>
                                    <td >{'>'} 15 % of Annual Revenue / Total Assets
                                    </td>
                                </tr>
                                <tr>
                                    <th>(R) Impact on Reputation</th>
                                    <td >Minor impact; awareness/ concern from specific individuals
                                    </td>
                                    <td >Limited impact; concern/ complaints from certain groups/ organizations (e.g., NGOs) period
                                    </td>
                                    <td >Local impact: public concern/ adverse publicity localised within neighbouring communities
                                    </td>
                                    <td >Suspected reputational damage; local/ regional public concern and reactions
                                    </td>
                                    <td >Noticeable reputational damage; national/ international public attention and repercussions
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="cons-table-group-2" style={{ marginTop: "15px" }}>
                        <table className="matrix-table-cons-2">
                            <thead>
                                <th colSpan={6} style={{ textAlign: "center" }} className="matrix-top-row">Type of Consequence</th>
                                <tr>
                                    <th className="corner-cell-cons" style={{ border: "0px", backgroundColor: "#002060" }}></th>
                                    <th className="corner-cell-cons" ></th>
                                    <th colSpan={2} style={{ textAlign: "center" }} >Injury to Personnel</th>
                                    <th colSpan={2} style={{ textAlign: "center" }} >Damage to Equipment</th>
                                </tr>
                                <tr>
                                    <th className="corner-cell-cons" style={{ border: "0px", backgroundColor: "#002060" }}></th>
                                    <th className="corner-cell-cons"></th>
                                    <th>Code</th>
                                    <th>Description</th>
                                    <th>Code</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td rowSpan={5} className="vertical-header-cons" style={{ backgroundColor: "#002060", color: "white", borderTop: "1px #002060 solid" }}>Consequence Level</td>
                                    <th>Insignificant</th>
                                    <td >FAC</td>
                                    <td >First Aid Case</td>
                                    <td >HPI-Minor</td>
                                    <td >Minor Damage</td>
                                </tr>
                                <tr>
                                    <th>Minor</th>
                                    <td >MTI</td>
                                    <td >Medical Treatment Injury</td>
                                    <td >HPI-Low</td>
                                    <td >Low Damage</td>
                                </tr>
                                <tr>
                                    <th>Moderate</th>
                                    <td >LTI</td>
                                    <td >Lost Time Injury</td>
                                    <td >HPI-Mod</td>
                                    <td >Moderate Damage</td>
                                </tr>
                                <tr>
                                    <th>High</th>
                                    <td >SFI</td>
                                    <td >Single Fatality Incident</td>
                                    <td >HPI-High</td>
                                    <td >High Damage</td>
                                </tr>
                                <tr>
                                    <th>Major</th>
                                    <td>MFI</td>
                                    <td >Multiple Fatality Incident</td>
                                    <td >HPI-Major</td>
                                    <td >Major Damage</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default ConsequenceRating;