import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    totalComponents: {
        title: "Number of Components",
        text: "This tile shows the amount of components that are currently in the Digital Warehouse for the organisation. This count includes all components in the Digital Warehouse, including valid components, invalid components. The month-on-month indicator shows if the amount of components has increased, decreased, or stayed the same compared to last month."
    },

    validComponents: {
        title: "Number of Valid Components",
        text: "This tile shows the amount of components in the Digital Warehouse that are currently valid. A component is counted as valid when its expiry date has not passed yet, and its certificate was issued by a certification body that has a valid certification body certificate. The month-on-month indicator shows if the amount of valid components has increased, decreased, or stayed the same compared to last month."
    },

    invalidComponents: {
        title: "Number of Invalid Components",
        text: "This tile shows the amount of components in the Digital Warehouse that are currently invalid. A component is counted as invalid when its expiry date has passed, or when its certificate was issued by a certification body that has an expired certification body certificate. The month-on-month indicator shows if the amount of invalid components has increased, decreased, or stayed the same compared to last month."
    },

    componentsInRepair: {
        title: "Components in Repair",
        text: "This tile shows the amount of components that are currently in repair in the Digital Warehouse. These are components that are not currently available for normal use because they are being repaired. The month-on-month indicator shows if the amount of components in repair has increased, decreased, or stayed the same compared to last month."
    }
};

const getPopupTypeFromTitle = (title = "") => {
    const cleanTitle = String(title).toLowerCase();

    if (cleanTitle.includes("valid")) {
        return "validComponents";
    }

    if (cleanTitle.includes("invalid")) {
        return "invalidComponents";
    }

    if (cleanTitle.includes("repair")) {
        return "componentsInRepair";
    }

    if (cleanTitle.includes("component")) {
        return "totalComponents";
    }

    return "default";
};

const DEFAULT_CONTENT = {
    title: "Dashboard Information",
    text: "This popup explains what the selected dashboard tile means."
};

const InfoPopupDashWare = ({ type, title, setClose }) => {
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

export default InfoPopupDashWare;