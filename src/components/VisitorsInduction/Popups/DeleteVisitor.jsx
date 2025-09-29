import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DeleteVisitor = ({ closeModal, deleteVisitor, name, loading }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Delete Visitor</h2>
                    <button className="delete-file-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">{"Are you sure you want to delete this visitor?"}</div>
                    <div>{name}</div>
                </div>

                <div className="delete-file-buttons">
                    <button className="delete-file-button-delete" onClick={deleteVisitor} disabled={loading}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Delete'}
                    </button>
                    <button className="delete-file-button-cancel" onClick={closeModal}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteVisitor;