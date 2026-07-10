import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    total: {
        title: "Total Documents",
        text: "Shows the total number of documents stored in the system, including valid and invalid documents."
    },

    valid: {
        title: "Valid Documents",
        text: "Shows the number of approved and active documents that are available for use and have not yet reached their review date."
    },

    expiring: {
        title: "Due for Review Documents",
        text: "Shows the number of documents that are approaching their scheduled date and require review."
    },

    expired: {
        title: "Review Overdue Documents",
        text: "Shows the number of documents that have passed their scheduled review date."
    },

    owners: {
        title: "Document Owners",
        text: "Shows the total number of individuals assigned responsibility for maintaining and reviewing documents."
    },

    upload: {
        title: "Latest Upload Date",
        text: "Shows the most recent date on which a document was uploaded to the system."
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