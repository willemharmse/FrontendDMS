import React, { useEffect, useState } from "react";
import "./DeletePopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const BatchDeletePopup = ({ closeModal, deleteFile, deleteFileFromTrash, selectedFileName, isTrashView, loading, selectedCount = 0 }) => {
    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Delete File{selectedCount === 1 ? "" : "s"}</h2>
                    <button className="delete-file-close" onClick={closeModal} disabled={loading} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">{isTrashView ? "Are you sure you want to permanently delete the selected files from trash?" : "Are you sure you want to delete the selected files?"}</div>
                    <div>{selectedCount} document{selectedCount === 1 ? "" : "s"} will be deleted{isTrashView ? " permanently." : "."}</div>
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
                    <button className="delete-file-button-cancel" onClick={closeModal} disabled={loading}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchDeletePopup;