import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DeleteSitePerm = ({ setIsDeleteModalOpen, siteName, handleDelete }) => {
    return (
        <div className="delete-popup-overlay-dm">
            <div className="delete-popup-content-dm">
                <div className="delete-file-header-dm">
                    <h2 className="delete-file-title-dm">Delete Site</h2>
                    <button className="delete-file-close-dm" onClick={() => setIsDeleteModalOpen(false)} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group-dm">
                    <div className="delete-file-text-dm">{"Do you want to delete the following site, as well as all certificates linked to it?"}</div>
                    <div>{siteName}</div>
                </div>

                <div className="delete-file-buttons-dm">
                    <button className="delete-file-button-delete-dm" onClick={handleDelete}>
                        Delete
                    </button>
                    <button className="delete-file-button-cancel-dm" onClick={() => setIsDeleteModalOpen(false)}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteSitePerm;