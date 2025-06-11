

import React, { useState, useEffect } from "react";
import "./TaskExecution.css"; // Add styling here

const TaskExecution = ({ setClose }) => {
    return (
        <div className="popup-overlay-taks-exe">
            <div className="popup-content-taks-exe">
                <div className="review-date-header">
                    <h2 className="review-date-title">Task Execution</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="taks-exe-table-group-2">
                    <div className="popup-table-wrapper-taks-exe-2">
                        <p>
                            Specify the <strong>responsible (R) persons</strong> involved in the task.
                        </p>
                    </div>
                </div>

                <div className="taks-exe-table-group">
                    <div className="popup-table-wrapper-taks-exe">
                        <table className="popup-table haznt-fam">
                            <thead className="taks-exe-headers">
                                <tr>
                                    <th className="inp-size-taks-exe">Term</th>
                                    <th className="desc-size-taks-exe">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>
                                        R
                                    </td>
                                    <td>
                                        Responsible Person
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

export default TaskExecution;