import React from "react";
import "./InfoPopupDash.css";

const toLower = (value) => String(value || "").toLowerCase();

const INFO_CONTENT = {
    totalInDevelopment: {
        title: "Total Documents in Development",
        getText: ({ systemType, documentType }) =>
            `Shows the total number of documents currently being created, reviewed, or approved in the system before sign-off.`
    },

    inApproval: {
        title: "In Approval",
        getText: ({ systemType, documentType }) =>
            `Shows the number of documents developed in the system submitted for approval within the system.`
    },

    inReview: {
        title: "In Review",
        getText: ({ systemType, documentType }) =>
            `Shows the number of documents currently being reviewed for accuracy, completeness, and readiness for approval within the system.`
    },

    pendingSignOff: {
        title: "Pending Sign-Off",
        getText: ({ systemType, documentType }) =>
            `Shows the number of documents that have been reviewed and approved, now awaiting a signed off pdf copy to be uploaded to the system.`
    },

    underPeriodicReview: {
        title: "Under Periodic Review",
        getText: ({ systemType, documentType }) =>
            `Shows the number of approved documents currently undergoing scheduled review to confirm they remain accurate, relevant, and fit for use.`
    },

    averageTurnAroundTime: {
        title: "Average Turn Around Time",
        getText: ({ systemType, documentType }) =>
            `Shows the average time taken for documents to move from creation or review to final sign-off.`
    }
};

const getPopupTypeFromTitle = (title = "") => {
    const cleanTitle = toLower(title);

    if (cleanTitle.includes("total")) return "totalInDevelopment";
    if (cleanTitle.includes("approval")) return "inApproval";
    if (cleanTitle.includes("review") && !cleanTitle.includes("periodic")) return "inReview";
    if (cleanTitle.includes("pending")) return "pendingSignOff";
    if (cleanTitle.includes("periodic")) return "underPeriodicReview";
    if (cleanTitle.includes("turn")) return "averageTurnAroundTime";

    return "default";
};

const DEFAULT_CONTENT = {
    title: "Dashboard Information",
    getText: () => "This popup explains what the selected dashboard tile means."
};

const InfoPopupDashCreate = ({
    type,
    title,
    systemType = "the system",
    documentType = "document",
    setClose
}) => {
    const popupType = type || getPopupTypeFromTitle(title);
    const content = INFO_CONTENT[popupType] || DEFAULT_CONTENT;

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
                        {content.getText({ systemType, documentType })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InfoPopupDashCreate;