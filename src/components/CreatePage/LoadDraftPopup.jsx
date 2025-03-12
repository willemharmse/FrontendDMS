import React, { useEffect, useState } from "react";
import "./LoadDraftPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const LoadDraftPopup = ({ isOpen, onClose, setLoadedID, loadData, userID }) => {
    const [drafts, setDrafts] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, draftId: null });

    useEffect(() => {
        const getDraftDocuments = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/drafts/${userID}`, {
                    method: "GET",
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch drafts");
                }

                const data = await response.json();
                setDrafts(data);
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            }
        };

        getDraftDocuments();
    }, [userID]);

    const handleLoad = async (draftId) => {
        await setLoadedID(draftId);
        await loadData(draftId);
        onClose();
    };

    const confirmDelete = (draftId) => {
        setDeleteConfirm({ open: true, draftId });
    };

    const handleDelete = async () => {
        const { draftId } = deleteConfirm;
        if (!draftId) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/delete/${draftId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete draft");
            }

            setDrafts(drafts.filter(draft => draft._id !== draftId));
        } catch (error) {
            console.error("Failed to delete draft:", error);
        }

        setDeleteConfirm({ open: false, draftId: null });
    };

    if (!isOpen) return null;

    return (
        <div className="draftLoad-popup-overlay">
            <div className="draftLoad-popup-content">
                <h3 className="draftLoad-popup-title">Select Draft to Load</h3>
                <div className="draft-list">
                    {drafts.length === 0 ? (
                        <p>No drafts available</p>
                    ) : (
                        drafts.map((draft) => (
                            <div key={draft._id} className="draft-item">
                                <span className="draft-title">{draft.formData.title || "Untitled Draft"}</span>
                                <div className="draft-buttons">
                                    <button className="draft-btn load" onClick={() => handleLoad(draft._id)}>Load</button>
                                    <button className="draft-btn delete" onClick={() => confirmDelete(draft._id)}><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <button className="draftLoad-popup-button" onClick={onClose}>Close</button>
            </div>

            {deleteConfirm.open && (
                <div className="delete-confirm-overlay-ld">
                    <div className="delete-confirm-content-ld">
                        <p>Are you sure you want to delete this draft?</p>
                        <div className="delete-confirm-actions-ld">
                            <button className="confirm-btn-ld" onClick={handleDelete}>Yes</button>
                            <button className="cancel-btn-ld" onClick={() => setDeleteConfirm({ open: false, draftId: null })}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoadDraftPopup;
