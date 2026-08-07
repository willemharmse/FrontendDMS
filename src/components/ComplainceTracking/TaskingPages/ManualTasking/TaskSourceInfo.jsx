
import React, { useState, useEffect } from "react";

const TaskSourceInfo = ({ setClose }) => {
    return (
        <div className="popup-overlay-haz">
            <div className="popup-content-cts-source">
                <div className="review-date-header">
                    <h2 className="review-date-title">Task Source</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="source-info-cts-table-group">
                    <span className="note-text" style={{ marginTop: "0px", marginBottom: "0px" }}>
                        The Source column shows how the task was created in the system.
                        <br />
                        <br />
                        <strong>System Generated: </strong><br />
                        This task was created by the system automatically.
                        <br />
                        <br />
                        <strong>User Assigned: </strong><br />
                        This task was created by a user and assigned to another user outside of the CTS task management.
                        <br />
                        <br />
                        <strong>User Created: </strong><br />
                        This task was created by a user and assigned to another user in the CTS task management.
                        <br />
                        <br />
                        <strong>User Triggered: </strong><br />
                        This task was created by the system as a result of an action by another user, such as publishing a document for review and approval.
                    </span>
                </div>
            </div>
        </div>
    )
};

export default TaskSourceInfo;