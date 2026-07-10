import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    organisationCompliance: {
        title: "Organisation Compliance",
        text: "Shows the overall flameproof compliance status across the organisation."
    },

    totalComponentCertificates: {
        title: "Total Component Certificates",
        text: "Shows the total number of component flameproof certificates uploaded in the system. This includes both valid and invalid certificates."
    },

    validComponentCertificates: {
        title: "Valid Component Certificates",
        text: "Shows the number of flameproof component certificates that are active, valid, and have not yet reached their expiry date."
    },

    expiringComponentCertificates: {
        title: "Expiring Component Certificates",
        text: "Shows the number of flameproof component certificates that are approaching their expiry or renewal date and require action."
    },

    invalidComponentCertificates: {
        title: "Invalid Component Certificates",
        text: "Shows the number of flameproof component certificates that are expired, missing required information, or no longer valid for compliance purposes."
    },

    outstandingComponentCertificates: {
        title: "Outstanding Component Certificates",
        text: "Shows the number of flameproof component certificates that are required but have not yet been uploaded to the system."
    }
};

const getPopupTypeFromTitle = (title = "") => {
    const cleanTitle = String(title).toLowerCase();

    if (cleanTitle.includes("organisation")) {
        return "organisationCompliance";
    }

    if (cleanTitle.includes("total")) {
        return "totalComponentCertificates";
    }

    if (cleanTitle.includes("valid")) {
        return "validComponentCertificates";
    }

    if (cleanTitle.includes("expiring")) {
        return "expiringComponentCertificates";
    }

    if (cleanTitle.includes("invalid")) {
        return "invalidComponentCertificates";
    }

    if (cleanTitle.includes("outstanding")) {
        return "outstandingComponentCertificates";
    }

    return "default";
};

const DEFAULT_CONTENT = {
    title: "Dashboard Information",
    text: "This popup explains what the selected dashboard tile means."
};

const InfoPopupDashFlame = ({ type, title, setClose }) => {
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
                        {content.text}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InfoPopupDashFlame;