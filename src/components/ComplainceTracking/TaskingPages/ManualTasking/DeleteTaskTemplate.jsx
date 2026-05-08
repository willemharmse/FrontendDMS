import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DeleteTaskTemplate = ({ cancel, open, task, taskName, onClose, handleDeleteTask }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">{cancel ? "Permanently Delete Task Template" : "Delete Task Template"}</h2>
                    <button className="delete-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">{cancel ? "Are you sure you want to permanently delete this task template?" : "Are you sure you want to delete this task template?"}</div>
                    <div>{taskName || ""}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={handleDeleteTask}>
                        {"Delete"}
                    </button>
                    <button className="delete-file-button-cancel" onClick={onClose}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTaskTemplate;