import React, { useEffect, useState } from "react";
import "./LoadDraftPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faCircleLeft, faPenToSquare, faRotateLeft, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';

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

                console.log(data);
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
                <div className="review-date-header">
                    <h2 className="review-date-title">Load Draft</h2>
                    <button className="review-date-close" onClick={onClose}>×</button>
                </div>
                <div className="draft-table-group">
                    <div className="popup-table-wrapper-draft">
                        <div className="draft-select-text">Select draft to load</div>
                        <table className="popup-table font-fam">
                            <thead className="draft-headers">
                                <tr>
                                    <th className="draft-nr">Nr</th>
                                    <th className="draft-name">Draft Document</th>
                                    <th className="draft-actions-load">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drafts.length > 0 ? (
                                    drafts
                                        .map((item, index) => (
                                            <tr key={item._id}>
                                                <td className="draft-nr">
                                                    {index + 1}
                                                </td>
                                                <td onClick={() => handleLoad(item._id)} className="load-draft-td">{`${item.formData.title} ${item.formData.documentType}`}</td>
                                                <td className="load-draft-delete">
                                                    <button
                                                        className={"action-button-load-draft delete-button-load-draft"}
                                                        onClick={() => confirmDelete(item._id)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">Loading abbreviations...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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
