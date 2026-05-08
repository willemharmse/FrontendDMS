import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const RestoreTaskTemplate = ({ task, taskName, onClose, handleRestore }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">{"Restore Task Template"}</h2>
                    <button className="delete-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">{"Are you sure you want to restore this task template?"}</div>
                    <div>{taskName || ""}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-cancel" style={{ marginRight: "10px", marginLeft: "auto" }} onClick={handleRestore}>
                        {"Restore"}
                    </button>
                    <button className="delete-file-button-delete" style={{ marginRight: "auto", marginLeft: "10px" }} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoreTaskTemplate;