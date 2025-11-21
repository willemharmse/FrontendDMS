import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const RepublishInduction = ({ closeModal, retakeInduction, normalPublish }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Republish Induction</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text" style={{ marginBottom: "0px" }}>{"Will these changes require all visitors to complete the visitor induction again?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={retakeInduction}>
                        Yes
                    </button>
                    <button className="delete-file-button-cancel" onClick={normalPublish}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RepublishInduction;