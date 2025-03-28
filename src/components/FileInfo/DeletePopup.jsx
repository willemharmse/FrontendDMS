import React, { useEffect, useState } from "react";
import "./DeletePopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DeletePopup = ({ closeModal, deleteFile, deleteFileFromTrash, selectedFileName, isTrashView, loading }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Delete File</h2>
                    <button className="delete-file-close" onClick={closeModal}>×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">{isTrashView ? "Are you sure you want to delete this file from trash?" : "Are you sure you want to delete this file?"}</div>
                    <div>{selectedFileName}</div>
                </div>

                <div className="delete-file-buttons">
                    {isTrashView ?
                        <button className="delete-file-button-delete" onClick={deleteFileFromTrash} disabled={loading}>
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Delete'}
                        </button>
                        :
                        <button className="delete-file-button-delete" onClick={deleteFile} disabled={loading}>
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Delete'}
                        </button>
                    }
                    <button className="delete-file-button-cancel" onClick={closeModal}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeletePopup;