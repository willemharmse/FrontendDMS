import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DeleteAllocatedTask = ({ cancel, isPendingRepeating, open, task, taskName, onClose, handleDeleteTask }) => {
    const title = isPendingRepeating
        ? "Delete Scheduled Repeating Task"
        : cancel
            ? "Cancel Allocated Task"
            : "Delete Allocated Task";

    const bodyText = isPendingRepeating
        ? "This repeating task has not started yet. Are you sure you want to delete it? It will be permanently removed and will never be created."
        : cancel
            ? "Are you sure you want to cancel this allocated task?"
            : "Are you sure you want to delete this allocated task?";

    const confirmLabel = isPendingRepeating || !cancel ? "Delete" : "Cancel";

    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">{title}</h2>
                    <button className="delete-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">{bodyText}</div>
                    <div>{taskName || ""}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={handleDeleteTask}>
                        {confirmLabel}
                    </button>
                    <button className="delete-file-button-cancel" onClick={onClose}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAllocatedTask;