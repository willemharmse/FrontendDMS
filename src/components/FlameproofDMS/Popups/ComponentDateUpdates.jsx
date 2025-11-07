import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ComponentDateUpdates = ({ closeModal, navigateToPage }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Component Date Update Page</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="ask-navigate-text">{"Update component details?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={closeModal}>
                        No
                    </button>
                    <button className="delete-file-button-cancel" onClick={navigateToPage}>
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComponentDateUpdates;