import React, { useState } from "react";

const ReopenAllocatedWorkOrder = ({ open, taskName, onClose, onConfirm }) => {
    const [message, setMessage] = useState("");

    if (!open) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm(message);
    };

    const handleClose = () => {
        setMessage("");
        onClose();
    };

    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Reopen Work Order</h2>
                    <button className="delete-file-close" onClick={handleClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">Are you sure you want to reopen this work order?</div>
                    <div>{taskName || ""}</div>
                </div>

                <div className="manDefs-popup-group" style={{ marginTop: "10px" }}>
                    <label className="manDefs-popup-label">Reason for Reopening</label>
                    <textarea
                        rows={4}
                        style={{ resize: "none" }}
                        spellCheck="true"
                        className="manDefs-input-text-area"
                        placeholder="Insert the reason for reopening the work order."
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={handleConfirm}>
                        Reopen
                    </button>
                    <button className="delete-file-button-cancel" onClick={handleClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReopenAllocatedWorkOrder;