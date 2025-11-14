import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const MoveComponentConfirm = ({ closeModal, moveCertificate, serialNumber, component, loading, id }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Move Component From Warehouse</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text" style={{ marginBottom: "0px", paddingLeft: "5px", paddingRight: "5px" }}>{`Are you sure you want to move this component with serial number: ${serialNumber} to the asset and move out the current certificate for this component: ${component}?`}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={() => moveCertificate(id)} disabled={loading}>
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

export default MoveComponentConfirm;