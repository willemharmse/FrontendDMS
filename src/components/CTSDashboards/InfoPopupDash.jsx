import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    total: {
        title: "Total Documents",
        text: "This tile shows the amount of documents that are uploaded on the DMS. This count includes documents that are valid, documents that are due for review soon, and documents that have a review overdue. The month-on-month indicator shows if the amount of documents has increased, decreased, or stayed the same compared to last month."
    },

    valid: {
        title: "Valid Documents",
        text: "This tile shows the amount of documents uploaded to the DMS that have a review date that has not passed yet and is not due in the next 30 days. The month-on-month indicator shows if the amount of valid documents has increased, decreased, or stayed the same compared to last month."
    },

    expiring: {
        title: "Due for Review Documents",
        text: "This tile shows the amount of documents that are due for review soon. These are documents that have a review date coming up in the next 30 days. These documents have not passed their review date yet, but they need to be checked before they become overdue. The month-on-month indicator shows if the amount of documents due for review has increased, decreased, or stayed the same compared to last month."
    },

    expired: {
        title: "Review Overdue Documents",
        text: "This tile shows the amount of documents that have passed their review date. These documents are overdue and need to be reviewed. The month-on-month indicator shows if the amount of overdue documents has increased, decreased, or stayed the same compared to last month."
    },

    owners: {
        title: "Document Owners",
        text: "This tile shows the amount of different document owners on the DMS. A document owner is the person responsible for a document. The month-on-month indicator shows if the amount of document owners has increased, decreased, or stayed the same compared to last month."
    },

    upload: {
        title: "Latest Upload Date",
        text: "This tile shows the latest date that a document was uploaded on the DMS. This helps show how recently the DMS has been updated."
    }
};

const normaliseType = (type, title) => {
    const raw = String(type || title || "").toLowerCase().trim();

    if (raw.includes("total")) return "total";
    if (raw.includes("valid")) return "valid";
    if (raw.includes("due") || raw.includes("expiring")) return "expiring";
    if (raw.includes("overdue") || raw.includes("expired")) return "expired";
    if (raw.includes("owner")) return "owners";
    if (raw.includes("upload")) return "upload";

    return "default";
};

const DEFAULT_CONTENT = {
    title: "Dashboard Information",
    text: "This popup explains what the selected dashboard tile means."
};

const InfoPopupDash = ({ title, type, text, setClose }) => {
    const contentType = normaliseType(type, title);
    const content = INFO_CONTENT[contentType] || DEFAULT_CONTENT;

    return (
        <div className="dashInfo-overlay" role="dialog" aria-modal="true">
            <div className="dashInfo-content">
                <div className="review-date-header">
                    <h2 className="review-date-title">
                        {content.title || title}
                    </h2>

                    <button
                        type="button"
                        className="review-date-close"
                        onClick={setClose}
                        title="Close Popup"
                        aria-label="Close popup"
                    >
                        ×
                    </button>
                </div>

                <div className="dashInfo-body">
                    <p className="dashInfo-text">
                        {text || content.text}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InfoPopupDash;