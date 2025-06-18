// cer.jsx
import React from 'react';
import './ControlEffectiveness.css';

const ControlEffectiveness = ({ setClose }) => (
    <div className="popup-overlay-cer">
        <div className="popup-content-cer">
            {/* — Header — */}
            <div className="review-date-header">
                <h2 className="review-date-title">Control Effectiveness Rating</h2>
                <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
            </div>

            {/* — Boxed group contains subtitle, table & notes — */}
            <div className="cer-group">
                <div className="popup-table-wrapper-cer">
                    <table className="matrix-table-cer">
                        <thead>
                            <th rowSpan={3} colSpan={1} style={{ textAlign: "center", backgroundColor: "#002060", color: "white" }}>Consequence</th>
                            <th colSpan={4} style={{ textAlign: "center", backgroundColor: "#002060", color: "white" }}>Quality</th>
                            <tr style={{ borderTop: "solid 2px #002060" }}>
                                <th style={{ textAlign: "center" }}>100%</th>
                                <th style={{ textAlign: "center" }}>90%</th>
                                <th style={{ textAlign: "center" }}>59%</th>
                                <th style={{ textAlign: "center" }}>30%</th>
                            </tr>
                            <tr style={{ borderTop: "solid 2px #2F2F2F" }}>
                                <th style={{ textAlign: "center" }}>90% to</th>
                                <th style={{ textAlign: "center" }}>60% to</th>
                                <th style={{ textAlign: "center" }}>30% to</th>
                                <th style={{ textAlign: "center" }}>0% to</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th style={{ textAlign: "center", borderTop: "#BFBFBF 2px solid", backgroundColor: "#BFBFBF" }}>Elimination</th>
                                <td className="low" style={{ textAlign: "center" }}>Very Effective</td>
                                <td className="medium" style={{ textAlign: "center" }}>Could Improve</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                            </tr>
                            <tr style={{ borderTop: "solid 1px #BFBFBF" }}>
                                <th style={{ textAlign: "center", borderTop: "none", backgroundColor: "#BFBFBF" }}>Substitution</th>
                                <td className="low" style={{ textAlign: "center" }}>Very Effective</td>
                                <td className="medium" style={{ textAlign: "center" }}>Could Improve</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                            </tr>
                            <tr style={{ borderTop: "solid 1px #BFBFBF" }}>
                                <th style={{ textAlign: "center", borderTop: "none", backgroundColor: "#BFBFBF" }}>Engineering</th>
                                <td className="low" style={{ textAlign: "center" }}>Very Effective</td>
                                <td className="medium" style={{ textAlign: "center" }}>Could Improve</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                            </tr>
                            <tr style={{ borderTop: "solid 1px #BFBFBF" }}>
                                <th style={{ textAlign: "center", backgroundColor: "#BFBFBF" }}>Seperation</th>
                                <td className="low" style={{ textAlign: "center" }}>Very Effective</td>
                                <td className="medium" style={{ textAlign: "center" }}>Could Improve</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                            </tr>
                            <tr style={{ borderTop: "solid 1px #BFBFBF" }}>
                                <th style={{ textAlign: "center", borderTop: "none", backgroundColor: "#BFBFBF" }}>Administration</th>
                                <td className="medium" style={{ textAlign: "center" }}>Could Improve</td>
                                <td className="medium" style={{ textAlign: "center" }}>Could Improve</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                            </tr>
                            <tr style={{ borderTop: "solid 1px #BFBFBF" }}>
                                <th style={{ textAlign: "center", borderTop: "none", backgroundColor: "#BFBFBF" }}>PPE</th>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                                <td className="high" style={{ textAlign: "center" }}>Not Effective</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);

export default ControlEffectiveness;
