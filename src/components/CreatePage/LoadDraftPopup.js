import React, { useEffect, useState } from "react";
import "./LoadDraftPopup.css";

const LoadDraftPopup = ({ isOpen, onClose, setLoadedID, loadData, userID }) => {
    const [selectedDraft, setSelectedDraft] = useState("");
    const [drafts, setDrafts] = useState([]);

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

    const handleSubmit = async () => {
        if (!selectedDraft) return;

        const draftId = selectedDraft;  // Capture the current selected value

        await setLoadedID(draftId);
        await loadData(draftId);

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="draftLoad-popup-overlay">
            <div className="draftLoad-popup-content">
                <h3 className="draftLoad-popup-title">Select Draft to Load</h3>
                <select value={selectedDraft} onChange={(e) => setSelectedDraft(e.target.value)} className="draftLoad-popup-input">
                    <option value="">Select Draft</option>
                    {drafts.map((draft) => (
                        <option key={draft._id} value={draft._id}>
                            {draft.formData.title || "Untitled Draft"}
                        </option>
                    ))}
                </select>
                <div className="draftLoad-popup-actions">
                    <button
                        className="draftLoad-popup-button confirm"
                        onClick={handleSubmit}
                        disabled={!selectedDraft}
                    >
                        Load
                    </button>
                    <button className="draftLoad-popup-button cancel" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoadDraftPopup;
