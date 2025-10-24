import React, { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const LoadPublishedIndcutionPopup = () => {
    return (
        <div className="draftLoad-popup-overlay">
            <div className="draftLoad-popup-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">Load Published Induction</h2>
                </div>
                <div className="draft-table-group">
                    <div className="popup-table-wrapper-draft">
                        <div className="draft-loading" aria-live="polite">
                            <FontAwesomeIcon icon={faSpinner} className="spin" />
                            <span style={{ marginLeft: 10, fontWeight: "normal" }}>Loading Published Induction</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadPublishedIndcutionPopup;
