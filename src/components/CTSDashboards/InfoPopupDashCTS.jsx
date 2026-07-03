import React from "react";
import "./InfoPopupDash.css";

const INFO_CONTENT = {
    openTasks: {
        title: "Open Tasks",
        text: "This tile shows the amount of tasks in CTS that are still open. These are tasks that have not been closed out yet and are not overdue. The month-on-month indicator shows if the amount of open tasks has increased, decreased, or stayed the same compared to last month."
    },

    overdueTasks: {
        title: "Overdue Tasks",
        text: "This tile shows the amount of tasks in CTS that are overdue. These are tasks where the due date has already passed and the task has not been closed out yet. The month-on-month indicator shows if the amount of overdue tasks has increased, decreased, or stayed the same compared to last month."
    },

    tasksDueThisWeek: {
        title: "Tasks Due This Week",
        text: "This tile shows the amount of open tasks in CTS that are due this week. These are tasks that have not been closed out yet and have a due date that falls within the current week. The month-on-month indicator shows if the amount of tasks due this week has increased, decreased, or stayed the same compared to last month."
    },

    tasksRequiringCloseOut: {
        title: "Tasks Requiring Close Out",
        text: "This tile shows the amount of tasks in CTS that require close out. These are tasks that have been finished by the responsible person and now need to be closed out by the allocator. The month-on-month indicator shows if the amount of tasks requiring close out has increased, decreased, or stayed the same compared to last month."
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