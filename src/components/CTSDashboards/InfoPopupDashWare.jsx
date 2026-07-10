import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    totalComponents: {
        title: "Number of Components",
        text: "Shows the total number of components registered in the Digital Warehouse."
    },

    validComponents: {
        title: "Number of Valid Components",
        text: "Shows the total number of components registered in the Digital Warehouse that have valid flameproof certificates."
    },

    invalidComponents: {
        title: "Number of Invalid Components",
        text: "Shows the total number of components registered in the Digital Warehouse that do not have valid flameproof certificates or do not have certificates uploaded."
    },

    componentsInRepair: {
        title: "Components in Repair",
        text: "Shows the number of components registered in the Digital Warehouse that require repairs or are currently getting repaired or worked on."
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