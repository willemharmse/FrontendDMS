import React, { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const SavingInProgress = () => {
    return (
        <div className="draftLoad-popup-overlay">
            <div className="exportSID-popup-content" style={{ background: "transparent" }}>
                <div className="review-date-header">
                    <h2 className="review-date-title"></h2>
                </div>
                <div className="exportSID-table-group" style={{ backgroundColor: "#c7c7c7" }}>
                    <div className="exportSID-table-wrapper-draft">
                        <div className="draft-loading-vertical" aria-live="polite">
                            <FontAwesomeIcon icon={faSpinner} className="draft-spinner-large draft-spinner-animate" />
                            <span className="draft-loading-text">
                                Saving Document
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavingInProgress;
