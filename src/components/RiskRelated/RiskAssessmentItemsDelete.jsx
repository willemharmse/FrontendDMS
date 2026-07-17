import React from "react";

const RiskAssessmentItemsDelete = ({ closeModal, type, specialText, removeRow }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">{`Remove ${type}`}</h2>
                    <button type="button" className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-risk-row-popup-group">
                    <div className="delete-file-text" style={{ marginBottom: "0px" }}>{specialText ? specialText : `Are you sure you want to remove this ${type.toLowerCase()}?`}</div>
                </div>

                <div className="delete-file-buttons">
                    <button type="button" className="delete-file-button-delete" onClick={removeRow}>
                        {'Remove'}
                    </button>
                    <button type="button" className="delete-file-button-cancel" onClick={closeModal}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskAssessmentItemsDelete;