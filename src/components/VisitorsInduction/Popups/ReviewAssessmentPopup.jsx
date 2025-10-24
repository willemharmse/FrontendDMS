import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const ReviewAssessmentPopup = ({ closeModal, submit }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Submit Assessment</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group-startAssessment">
                    <div className="delete-file-text-startAssessment">{"Are you sure you want to submit your assessment, or would you like to review your answers?"}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete-startAssessment" onClick={closeModal}>
                        {'Review'}
                    </button>
                    <button className="delete-file-button-cancel-startAssessment" onClick={submit}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewAssessmentPopup