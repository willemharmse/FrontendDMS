import React, { useState } from "react";

const CloseAllocatedWorkOrder = ({ open, taskName, onClose, onConfirm }) => {
    const [closeOutComments, setCloseOutComments] = useState("");

    if (!open) return null;

    const handleConfirm = () => {
        onConfirm(closeOutComments);
        setCloseOutComments("");
    };

    const handleClose = () => {
        setCloseOutComments("");
        onClose();
    };

    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Close Out Work Order</h2>
                    <button className="delete-file-close" onClick={handleClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">Are you sure you want to close out this work order?</div>
                    <div>{taskName || ""}</div>
                </div>

                <div className="manDefs-popup-group" style={{ marginTop: "12px" }}>
                    <label className="delete-file-text" style={{ fontWeight: "normal", marginBottom: "10px" }}>Close Out Comments</label>
                    <textarea
                        rows={4}
                        style={{ resize: "none", marginTop: "10px", fontFamily: "Arial" }}
                        spellCheck="true"
                        className="manDefs-input-text-area"
                        placeholder="Add any comments regarding the close out of this task."
                        value={closeOutComments}
                        onChange={(e) => setCloseOutComments(e.target.value)}
                    />
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-cancel" style={{ marginLeft: "auto", marginRight: "10px" }} onClick={handleConfirm}>
                        Close Out
                    </button>
                    <button className="delete-file-button-delete" style={{ marginLeft: "10px", marginRight: "auto" }} onClick={handleClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloseAllocatedWorkOrder;