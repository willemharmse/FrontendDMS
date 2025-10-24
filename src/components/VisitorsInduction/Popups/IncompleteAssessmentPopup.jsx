import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const IncompleteAssessmentPopup = ({ closeModal, submit }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Assessment Incomplete</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group-startAssessment">
                    <div className="delete-file-text-startAssessment">{"Some questions have not been answered. Would you like to return and complete the assessment, or proceed with submission?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete-startAssessment" onClick={submit}>
                        {'Submit'}
                    </button>
                    <button className="delete-file-button-cancel-startAssessment" onClick={closeModal}>
                        Complete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncompleteAssessmentPopup