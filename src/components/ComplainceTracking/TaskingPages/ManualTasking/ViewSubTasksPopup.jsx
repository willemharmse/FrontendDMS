import React from "react";

// Same status mapping/logic used on the normal tasking page (ManualTaskingPage.js)
const STATUS_OPTIONS = [
    { value: "25% Completed", label: "25% Completed", color: "#FFC000" },
    { value: "50% Completed", label: "50% Completed", color: "#FFFF00" },
    { value: "75% Completed", label: "75% Completed", color: "#FFFFCC" },
    { value: "Completed", label: "Submitted", color: "#7EAC87" },
    { value: "Cancelled", label: "Cancelled", color: "#CB6F6F" },
];

const getStatusDisplay = (status) => {
    if (status === "Completed") return "Submitted";
    return status || "-";
};

const getStatusColor = (status) => {
    const match = STATUS_OPTIONS.find(o => o.value === status);
    return match ? match.color : "#f0f0f0";
};

const getStatusTextColor = (status) =>
    status === "Completed" || status === "Cancelled" ? "#FFFFFF" : "#000000";

const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Africa/Johannesburg",
    });
};

const ViewSubTasksPopup = ({ onClose, parentTask, subtasks = [] }) => {
    return (
        <div className="batch-popup-overlay">
            <div className="migrate-owner-content">
                <div className="batch-file-header">
                    <h2 className="batch-file-title">View Sub Tasks</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                {/* Section 1: Task Title (plain text, no dropdown) */}
                <div className="migrate-owner-group">
                    <div className="batch-file-text">Main Task Title</div>
                    <p style={{ marginBottom: "0px" }}>{parentTask?.taskTitle || "-"}</p>
                </div>

                {/* Section 2: Sub Tasks table */}
                <div className="migrate-owner-group" style={{ fontFamily: "Arial", marginBottom: "0px", paddingBottom: "10px" }}>
                    <div className="batch-file-text">All Sub Tasks</div>

                    <div className="migrate-owner-files-box">
                        {subtasks.length === 0 ? (
                            <div className="migrate-owner-empty-state">
                                No sub tasks found.
                            </div>
                        ) : (
                            <table className="migrate-owner-files-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "40%", textAlign: "center", fontSize: "16px" }}>Title</th>
                                        <th style={{ width: "20%", textAlign: "center", fontSize: "16px" }}>Responsible</th>
                                        <th style={{ width: "20%", textAlign: "center", fontSize: "16px" }}>Due Date</th>
                                        <th style={{ width: "20%", textAlign: "center", fontSize: "16px" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subtasks.map((sub, index) => (
                                        <tr key={sub._id || index}>
                                            <td className="migrate-owner-file-name-cell" style={{ textAlign: "left" }}>
                                                {sub.taskTitle || sub.taskDescription || "-"}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {sub.responsible?.username || sub.responsibleName || "-"}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {formatDate(sub.dueDate)}
                                            </td>
                                            <td style={{ textAlign: "center", backgroundColor: getStatusColor(sub.status), color: getStatusTextColor(sub.status), fontWeight: 500 }}>
                                                {getStatusDisplay(sub.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewSubTasksPopup;