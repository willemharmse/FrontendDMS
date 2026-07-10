import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    totalControls: {
        title: "Total Controls in System",
        text: "Shows the total number of standard controls in the system. These can be selected for use in risk assessments (IBRA and BLRA)."
    },

    criticalControls: {
        title: "Critical Controls",
        text: "Shows the total number of controls in the system that are identified as critical."
    },

    controlsOfConcern: {
        title: "Controls of Concern",
        text: "Shows the total number of controls in the system that have a quality rating below 30%. These controls need to be improved."
    },

    controlsToMonitor: {
        title: "Controls to Monitor",
        text: "Shows the total number of controls in the system that have a quality rating between 30% and 90%. These controls can be improved."
    }
};

const getPopupTypeFromTitle = (title = "") => {
    const cleanTitle = String(title).toLowerCase();

    if (cleanTitle.includes("total")) {
        return "totalControls";
    }

    if (cleanTitle.includes("critical")) {
        return "criticalControls";
    }

    if (cleanTitle.includes("concern")) {
        return "controlsOfConcern";
    }

    if (cleanTitle.includes("monitor")) {
        return "controlsToMonitor";
    }

    return "default";
};

const DEFAULT_CONTENT = {
    title: "Dashboard Information",
    text: "This popup explains what the selected dashboard tile means."
};

const InfoPopupDashControl = ({ type, title, setClose }) => {
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

export default InfoPopupDashControl;