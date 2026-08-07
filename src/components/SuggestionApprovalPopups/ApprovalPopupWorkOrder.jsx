import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import "./ApprovalPopup.css"

const ApprovalPopupWorkOrder = ({ closeModal, approve, decline, suggestion, setSuggestion }) => {
    const dataObj =
        suggestion?.draft?.data ??
        suggestion?.data ??
        null;

    const valuesArr =
        dataObj && typeof dataObj === "object"
            ? Object.values(dataObj)
            : [];

    const [firstVal, setFirstVal] = useState(valuesArr[0] ?? "");
    const [secondVal, setSecondVal] = useState(valuesArr[1] ?? "");

    const buildUpdated = () => ({
        ...suggestion,
        data: {
            0: firstVal,
            1: secondVal,
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
                    <h2 className="review-date-title">Review Work Order Type Suggestion</h2>
                    <button className="review-date-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="approve-suggestion-group">
                    <div className="approve-suggestion-text">Do you want to approve this Work Order Type suggestion?</div>
                    <div className="approve-suggestion-group-text">
                        <div className="approve-suggestion-text">Work Order Type</div>
                        <input value={firstVal} onChange={(e) => setFirstVal(e.target.value)} className="approve-suggestion-input" />
                    </div>
                    <div className="approve-suggestion-group-spacer">
                    </div>
                    <div className="approve-suggestion-group-text">
                        <div className="approve-suggestion-text">Description</div>
                        <div><textarea value={secondVal} onChange={(e) => setSecondVal(e.target.value)} className="approve-suggestion-textarea" /></div>
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

export default ApprovalPopupWorkOrder;
