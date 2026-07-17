import React, { useEffect, useState } from "react";

const FTSSuggestionApproval = ({ closeModal, approve, decline, suggestion, setSuggestion }) => {
    const [firstVal, setFirstVal] = useState(suggestion.field ?? "");
    const [secondVal, setSecondVal] = useState(suggestion.definition ?? "");

    const handleApprove = () => {
        const updated = { ...suggestion, field: firstVal, definition: secondVal };
        setSuggestion?.(updated);
        approve(updated);
    }

    const handleDecline = () => {
        const updated = { ...suggestion, field: firstVal, definition: secondVal };
        setSuggestion?.(updated);
        decline(updated);
    }

    return (
        <div className="approve-suggestion-overlay">
            <div className="approve-suggestion-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Review Field Suggestion</h2>
                    <button className="review-date-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="approve-suggestion-group">
                    <div className="approve-suggestion-text">Do you want to approve this Field suggestion?</div>
                    <div className="approve-suggestion-group-text">
                        <div className="approve-suggestion-text">Field</div>
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

export default FTSSuggestionApproval;