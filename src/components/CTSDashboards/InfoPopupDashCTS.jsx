import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    openTasks: {
        title: "Open Tasks",
        text: "Shows the number of assigned tasks that are still active and require close-out."
    },

    overdueTasks: {
        title: "Overdue Tasks",
        text: "Shows the number of assigned tasks that have passed their due date and still require completion or close-out."
    },

    tasksDueThisWeek: {
        title: "Tasks Due This Week",
        text: "Shows the number of assigned tasks scheduled for close-out within the current week."
    },

    tasksRequiringCloseOut: {
        title: "Tasks Requiring Close Out",
        text: "Shows the number of completed or actioned tasks that still require verification, approval, or formal close-out."
    }
};

const getPopupTypeFromTitle = (title = "") => {
    const cleanTitle = String(title).toLowerCase();

    if (cleanTitle.includes("overdue")) {
        return "overdueTasks";
    }

    if (cleanTitle.includes("due this week")) {
        return "tasksDueThisWeek";
    }

    if (cleanTitle.includes("close out")) {
        return "tasksRequiringCloseOut";
    }

    if (cleanTitle.includes("open")) {
        return "openTasks";
    }

    return "default";
};

const DEFAULT_CONTENT = {
    title: "Dashboard Information",
    text: "This popup explains what the selected dashboard tile means."
};

const InfoPopupDashCTS = ({ type, title, setClose }) => {
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

export default InfoPopupDashCTS;