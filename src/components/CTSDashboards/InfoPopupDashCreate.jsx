import React from "react";
import "./InfoPopupDash.css";

const toLower = (value) => String(value || "").toLowerCase();

const INFO_CONTENT = {
    totalInDevelopment: {
        title: "Total Documents in Development",
        getText: ({ systemType, documentType }) =>
            `This tile shows the amount of ${documentType} that are currently in development in ${systemType}. This count includes ${documentType} that are in approval, in review, and pending sign-off. These are ${documentType} that have not been signed off yet. The month-on-month indicator shows if the amount of ${documentType} in development has increased, decreased, or stayed the same compared to last month.`
    },

    inApproval: {
        title: "In Approval",
        getText: ({ systemType, documentType }) =>
            `This tile shows the amount of ${documentType} in ${systemType} that are waiting for approval. These ${documentType} have already been reviewed and now require an approver to approve them. Once the ${documentType} has been approved, it can move further through the process so that it can be published. The month-on-month indicator shows if the amount of ${documentType} waiting for approval has increased, decreased, or stayed the same compared to last month.`
    },

    inReview: {
        title: "In Review",
        getText: ({ systemType, documentType }) =>
            `This tile shows the amount of ${documentType} in ${systemType} that are waiting to be reviewed. These ${documentType} require a reviewer to check the content before they can move to the next step in the process. The month-on-month indicator shows if the amount of ${documentType} waiting for review has increased, decreased, or stayed the same compared to last month.`
    },

    pendingSignOff: {
        title: "Pending Sign-Off",
        getText: ({ systemType, documentType }) =>
            `This tile shows the amount of ${documentType} in ${systemType} that are waiting for sign-off. These ${documentType} require a signed-off PDF to be uploaded before they can be signed off in the system. The month-on-month indicator shows if the amount of ${documentType} pending sign-off has increased, decreased, or stayed the same compared to last month.`
    },

    underPeriodicReview: {
        title: "Under Periodic Review",
        getText: ({ systemType, documentType }) =>
            `This tile shows the amount of ${documentType} in ${systemType} that are under periodic review. These ${documentType} were signed off previously, but are now being reviewed again as part of the normal review process. The month-on-month indicator shows if the amount of ${documentType} under periodic review has increased, decreased, or stayed the same compared to last month.`
    },

    averageTurnAroundTime: {
        title: "Average Turn Around Time",
        getText: ({ systemType, documentType }) =>
            `This tile shows the average amount of time it takes for a ${documentType} to move through the process in ${systemType}. It measures how long it takes from when the ${documentType} is reviewed until it is signed off. This helps show how quickly ${documentType} are being completed in the system.`
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