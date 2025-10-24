import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const StartAssessmentPopup = ({ closeModal, startAssessment }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Start Assessment</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group-startAssessment">
                    <div className="delete-file-text-startAssessment">{"Once you start the assessment, the Visitor Induction material will no longer be accessibl. Would you like to proceed or review the material first?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete-startAssessment" onClick={closeModal}>
                        {'Review Material'}
                    </button>
                    <button className="delete-file-button-cancel-startAssessment" onClick={startAssessment}>
                        Start Assessment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartAssessmentPopup