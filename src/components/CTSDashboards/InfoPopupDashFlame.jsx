import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    organisationCompliance: {
        title: "Organisation Compliance",
        text: "This tile shows the overall flameproof compliance for the organisation. It looks at all assets combined in the system and gives an indication of how compliant the organisation is based on the flameproof certificate information uploaded to EPAMS. The month-on-month indicator shows if the organisation compliance has increased, decreased, or stayed the same compared to last month."
    },

    totalComponentCertificates: {
        title: "Total Component Certificates",
        text: "This tile shows the total amount of component flameproof certificates that are uploaded to EPAMS. This count includes component certificates that are valid, expiring soon, and invalid. The month-on-month indicator shows if the amount of uploaded component certificates has increased, decreased, or stayed the same compared to last month."
    },

    validComponentCertificates: {
        title: "Valid Component Certificates",
        text: "This tile shows the amount of component flameproof certificates that are currently valid. A component certificate is counted as valid when it was issued by a certification body that has a valid certification body certificate, and the component certificate expiry date has not passed yet and is not coming up in the next 30 days. The percentage indicator shows how many of the uploaded component certificates are valid."
    },

    expiringComponentCertificates: {
        title: "Expiring Component Certificates",
        text: "This tile shows the amount of component flameproof certificates that are expiring soon. These are component certificates that have an expiry date coming up in the next 30 days. These certificates are still valid for now, but they need to be reviewed or replaced before they expire. The percentage indicator shows how many of the uploaded component certificates are expiring soon."
    },

    invalidComponentCertificates: {
        title: "Invalid Component Certificates",
        text: "This tile shows the amount of component flameproof certificates that are invalid. A component certificate is invalid when the certificate expiry date has already passed, or when it was issued by a certification body that has an expired certification body certificate. The percentage indicator shows how many of the uploaded component certificates are invalid."
    },

    outstandingComponentCertificates: {
        title: "Outstanding Component Certificates",
        text: "This tile shows the amount of components in the system that do not have a flameproof certificate uploaded for them. These components still require a component certificate to be uploaded in EPAMS. This helps show how many components are missing the required certificate information."
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