import React from "react";

/**
 * AcceptTaskPopup
 *
 * Shown when a viewer clicks the circle-check icon on a Pending task.
 * Gives the user two choices:
 *   1. Accept the task (sets acceptanceStatus → "Accepted")
 *   2. Delegate the task (opens DelegateTaskPopup)
 *
 * Props:
 *   open        {boolean}  – controls visibility
 *   taskName    {string}   – display name / description of the task
 *   onClose     {fn}       – close without action
 *   onAccept    {fn}       – user chose to accept
 *   onDelegate  {fn}       – user chose to delegate (parent opens DelegateTaskPopup)
 */
const AcceptWorkOrderPopup = ({ open, taskName, onClose, onAccept, onDelegate }) => {
    if (!open) return null;

    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Accept Work Order</h2>
                    <button className="delete-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">
                        What would you like to do with this work order?
                    </div>
                    <div style={{ marginTop: "6px", fontWeight: "500", fontSize: "14px" }}>
                        {taskName || ""}
                    </div>
                </div>

                <div className="delete-file-buttons">
                    {/* Primary action – accept */}
                    <button
                        className="delete-file-button-cancel"
                        onClick={onAccept}
                        title="Accept this work order and take responsibility"
                        style={{ marginLeft: "auto", marginRight: "10px" }}
                    >
                        Accept
                    </button>

                    {/* Secondary action – delegate */}
                    <button
                        className="delete-file-button-delete"
                        onClick={onDelegate}
                        title="Delegate this work order to another user"
                        style={{ marginLeft: "10px", marginRight: "auto" }}
                    >
                        Delegate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcceptWorkOrderPopup;
