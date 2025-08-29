import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import "./ApprovalPopup.css"

const ApprovalPopup = ({ closeModal, approve, decline, suggestion }) => {
    const formatType = (type) => {
        switch (type) {
            case 'Abbreviation':
                return "Abbreviation"
                break;

            case 'Definition':
                return "Term";
                break;

            case 'PPE':
                return "PPE";
                break;

            case 'Tool':
                return "Hand Tool";
                break;

            case 'Material':
                return "Material";
                break;

            case 'Mobile':
                return "Mobile Machinery";
                break;

            case 'Equipment':
                return "Equipment";
                break;
        }
    };

    const dataObj =
        suggestion?.draft?.data ??
        suggestion?.data ??
        null;

    // Derive a display value safely
    const valuesArr =
        dataObj && typeof dataObj === "object"
            ? Object.values(dataObj)
            : [];

    const firstVal = valuesArr[0] ?? "";
    const secondVal = valuesArr[1] ?? "";

    return (
        <div className="approve-suggestion-overlay">
            <div className="approve-suggestion-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Review Suggestion</h2>
                    <button className="review-date-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="approve-suggestion-group">
                    <div className="approve-suggestion-text">Do you want to approve this {formatType(suggestion.type)} suggestion?</div>
                    <div><strong>{String(firstVal)}</strong>{secondVal && (<>{`: ${String(secondVal)}`}</>)}</div>
                </div>

                <div className="approve-suggestion-buttons">
                    <button className="approve-suggestion-button-download" onClick={approve}>
                        {'Approve'}
                    </button>
                    <button className="approve-suggestion-button-cancel" onClick={decline}>
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalPopup;