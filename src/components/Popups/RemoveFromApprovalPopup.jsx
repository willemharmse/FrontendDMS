import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// Generic "remove from approval process" confirmation popup, driven by a
// document type + title rather than being hard-coded to one document type.
// Reuses the same class names / stylesheet as DeletePopup / RemoveApprovalPopup
// so it inherits the existing popup look and feel.
const RemoveFromApprovalPopup = ({ closeModal, removeApproval, docType, title, loading }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Remove From Approval Process</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">
                        Do you want to remove this {docType} from the approval process?
                    </div>
                    <div>{title}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={removeApproval} disabled={loading}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Remove'}
                    </button>
                    <button className="delete-file-button-cancel" onClick={closeModal}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemoveFromApprovalPopup;
