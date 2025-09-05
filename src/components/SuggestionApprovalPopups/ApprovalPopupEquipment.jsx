import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import "./ApprovalPopup.css"

const ApprovalPopupEquipment = ({ closeModal, approve, decline, suggestion, setSuggestion }) => {
    const dataObj =
        suggestion?.draft?.data ??
        suggestion?.data ??
        null;

    const valuesArr =
        dataObj && typeof dataObj === "object"
            ? Object.values(dataObj)
            : [];

    const [firstVal, setFirstVal] = useState(valuesArr[0] ?? "");

    const buildUpdated = () => ({
        ...suggestion,
        data: {
            0: firstVal,
        },
    });

    const handleApprove = () => {
        const updated = buildUpdated();
        setSuggestion?.(updated);
        approve(updated);
    }

    const handleDecline = () => {
        const updated = buildUpdated();
        setSuggestion?.(updated);
        decline(updated);
    }

    return (
        <div className="approve-suggestion-overlay">
            <div className="approve-suggestion-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Review Equipment Suggestion</h2>
                    <button className="review-date-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="approve-suggestion-group">
                    <div className="approve-suggestion-text">Do you want to approve this Equipment suggestion?</div>
                    <div className="approve-suggestion-group-text">
                        <div className="approve-suggestion-text">Equipment</div>
                        <input value={firstVal} onChange={(e) => setFirstVal(e.target.value)} className="approve-suggestion-input" />
                    </div>
                </div>

                <div className="approve-suggestion-buttons">
                    <button className="approve-suggestion-button-download" onClick={handleApprove}>
                        {'Approve'}
                    </button>
                    <button className="approve-suggestion-button-cancel" onClick={handleDecline}>
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalPopupEquipment;