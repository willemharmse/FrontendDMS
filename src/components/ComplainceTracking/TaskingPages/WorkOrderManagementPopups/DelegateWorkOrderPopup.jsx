import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

/**
 * DelegateTaskPopup
 *
 * Shown when the user chooses "Delegate Task" inside AcceptTaskPopup.
 * Fetches the list of assignable users (direct reports hierarchy) and
 * lets the current user pick someone to delegate to.
 *
 * On confirm the parent calls PUT /:id/delegate with { delegateTo, delegateToName }.
 *
 * Props:
 *   open        {boolean}  – controls visibility
 *   taskName    {string}   – display name / description of the task
 *   taskId      {string}   – _id of the task being delegated
 *   onClose     {fn}       – close without action
 *   onDelegated {fn(task)} – called with the updated task object after success
 */
const DelegateWorkOrderPopup = ({ open, taskName, taskId, onClose, onDelegated }) => {
    const [delegateTo, setDelegateTo] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [message, setMessage] = useState("")

    // ── Fetch assignable users (same hierarchy endpoint used elsewhere) ───────
    useEffect(() => {
        if (!open) return;
        setDelegateTo("");

        const fetchUsers = async () => {
            setFetchingUsers(true);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.REACT_APP_URL}/api/workOrderTasks/getUsers/assignable-users`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!response.ok) throw new Error("Failed to fetch users");
                const data = await response.json();
                const currentUserId = jwtDecode(token)?.userId || jwtDecode(token)?.id || "";
                const filtered = (data.users || []).filter((u) => String(u._id) !== String(currentUserId));
                setUsersList(filtered);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load users list.");
            } finally {
                setFetchingUsers(false);
            }
        };

        fetchUsers();
    }, [open]);

    const handleConfirm = async () => {
        if (!delegateTo) {
            toast.warn("Please select a user to delegate to.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const selectedUser = usersList.find(
                (u) => String(u._id) === String(delegateTo)
            );

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}/delegate`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        delegateTo: delegateTo,
                        delegateToName: selectedUser?.username || "",
                        delegationReason: message
                    }),
                }
            );

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to delegate task");
            }

            toast.success("Task delegated successfully.");
            if (onDelegated) onDelegated(result.task);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to delegate task.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="delete-popup-overlay">
            <div className="delete-popup-content">
                <div className="delete-file-header">
                    <h2 className="delete-file-title">Delegate Work Order</h2>
                    <button className="delete-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="delete-file-group">
                    <div className="delete-file-text">
                        Select a user to delegate this work order to:
                    </div>
                    <div style={{ marginTop: "6px", fontWeight: "500", fontSize: "14px" }}>
                        {taskName || ""}
                    </div>
                </div>

                <div className="abbr-popup-group" style={{ padding: "0 0 12px 0" }}>
                    <label className="abbr-popup-label" style={{ display: "block", marginBottom: "6px", color: "black" }}>
                        Delegate To:
                    </label>
                    <div className="abbr-popup-page-select-container">
                        {fetchingUsers ? (
                            <div style={{ textAlign: "center", padding: "8px" }}>
                                <FontAwesomeIcon icon={faSpinner} spin /> Loading users...
                            </div>
                        ) : (
                            <select
                                value={delegateTo}
                                onChange={(e) => setDelegateTo(e.target.value)}
                                className="abbr-popup-select"
                            >
                                <option value="">Select a user</option>
                                {usersList.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                <div className="manDefs-popup-group">
                    <label className="manDefs-popup-label">Delegation Reason</label>
                    <textarea rows={4} style={{ resize: "none" }} spellcheck="true" className="manDefs-input-text-area" placeholder="Insert the reason for the delegation." type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                <div className="delete-file-buttons">
                    <button
                        className="delete-file-button-delete"
                        onClick={handleConfirm}
                        disabled={loading || fetchingUsers}
                        title="Confirm delegation"
                    >
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Delegate"}
                    </button>
                    <button
                        className="delete-file-button-cancel"
                        onClick={onClose}
                        style={{ marginLeft: "8px" }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DelegateWorkOrderPopup;