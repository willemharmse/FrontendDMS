import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    totalControls: {
        title: "Total Controls in System",
        text: "This tile shows the total amount of controls that are currently added to the system. This count includes all controls in the system, including critical controls, controls of concern, controls to monitor, and controls with a good quality rating. The month-on-month indicator shows if the amount of controls has increased, decreased, or stayed the same compared to last month."
    },

    criticalControls: {
        title: "Critical Controls",
        text: "This tile shows the amount of controls in the system that are marked as critical controls. Critical controls are the controls that are important for managing key risks. The month-on-month indicator shows if the amount of critical controls has increased, decreased, or stayed the same compared to last month."
    },

    controlsOfConcern: {
        title: "Controls of Concern",
        text: "This tile shows the amount of controls in the system that have a quality rating below 30%. These controls need attention because their quality rating is very low. The month-on-month indicator shows if the amount of controls of concern has increased, decreased, or stayed the same compared to last month."
    },

    controlsToMonitor: {
        title: "Controls to Monitor",
        text: "This tile shows the amount of controls in the system that have a quality rating between 30% and 90%. This includes controls with a quality rating of 30-59% and controls with a quality rating of 60-90%. These controls should be monitored because they are not yet above 90%. The month-on-month indicator shows if the amount of controls to monitor has increased, decreased, or stayed the same compared to last month."
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