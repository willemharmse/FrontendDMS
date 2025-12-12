import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DeleteDeviceVisitorView = ({ closeModal, deleteVisitor, name, loading }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Delete Device</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group" style={{ paddingLeft: "7px", paddingRight: "7px" }}>
                    <div className="delete-file-text" style={{ marginBottom: "0px" }}>{"Are you sure you want to delete this device from the list?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={deleteVisitor} disabled={loading}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Yes'}
                    </button>
                    <button className="delete-file-button-cancel" onClick={closeModal}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteDeviceVisitorView;