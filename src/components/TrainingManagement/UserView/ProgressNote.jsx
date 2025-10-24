
import React, { useState, useEffect } from "react";

const ProgressNote = ({ setClose }) => {
    return (
        <div className="popup-overlay-haz">
            <div className="popup-content-progress">
                <div className="review-date-header">
                    <h2 className="review-date-title">Induction Progress</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="progress-ind-table-group">
                    <span className="note-text" style={{ marginTop: "0px", marginBottom: "0px" }}>
                        The Induction Progress column shows the overall completion status of the induction content and the assessment.
                        <br />
                        <br />
                        <strong>Not Started (0%):</strong> <br />
                        Induction has been not started.
                        <br />
                        <br />
                        <strong>In Progress (1 - 49%):</strong> <br />
                        Induction content has been started but not completed.
                        <br />
                        <br />
                        <strong>In Progress (50%):</strong> <br />
                        Induction content complete, assessment not started.
                        <br />
                        <br />
                        <strong>Completed (100%):</strong> <br />
                        Assessment has been completed (Passed).
                    </span>
                </div>
            </div>
        </div>
    )
};

export default ProgressNote;