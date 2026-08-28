import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// Reuses the same class names / stylesheet as DeletePopup so it inherits the
// existing popup look and feel. If you'd rather keep it fully separate, copy
// DeletePopup.css to RemoveApprovalPopup.css and update the import above.
const RemoveApprovalPopup = ({ closeModal, removeApproval, selectedFileName, loading }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Remove From Approval Process</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">
                        Are you sure you want to remove this template from the review/approval process?
                    </div>
                    <div>{selectedFileName}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={removeApproval} disabled={loading}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Remove'}
                    </button>
                    <button className="delete-file-button-cancel" onClick={closeModal}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemoveApprovalPopup;