import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

// Popup used from the allocator ("assigner") view of Work Order Management.
// Opened for a single work order row (passed in as `task`) to reassign the
// work order's responsible user. Hits PUT /api/workOrderTasks/:id/reassign.
const MigrateWorkOrder = ({ task, onClose, onReassigned }) => {
    const [usersList, setUsersList] = useState([]);          // List of all potential new responsible users
    const [selectedNewResponsible, setSelectedNewResponsible] = useState('');
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);

    const taskApiBase = () => `${process.env.REACT_APP_URL}/api/workOrderTasks`;

    // Current responsible user for this work order (read-only display)
    const currentResponsible = task?.responsible || task?.responsibleParty || "";

    // Fetch All Users (Potential new responsible users)
    useEffect(() => {
        const fetchUsers = async () => {
            setUsersLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_URL}/api/complainceTasks/getUsers/assignable-users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();
                setUsersList(data.users || []);
            } catch (error) {
                console.error(error.message);
                toast.error("Failed to load user list");
            } finally {
                setUsersLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleClick = async () => {
        if (!selectedNewResponsible) {
            toast.error("Please select a new responsible user.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        const newResponsibleObj = usersList.find(u => u.username === selectedNewResponsible);

        if (!newResponsibleObj?._id) {
            toast.error("Could not match the selected user. Please try again.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put(
                `${taskApiBase()}/${task?._id}/reassign`,
                {
                    newResponsible: newResponsibleObj._id,
                    newResponsibleName: selectedNewResponsible
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            toast.success(
                `Reassignment Successful.`,
                {
                    closeButton: true,
                    autoClose: 2000,
                    style: { textAlign: 'center' }
                }
            );

            setSelectedNewResponsible('');
            setLoading(false);

            if (onReassigned) {
                onReassigned(response.data);
            }

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            setLoading(false);
            console.error("Reassignment failed:", error);
            const errMsg = error.response?.data?.error || "Reassignment failed. Please try again.";
            toast.error(errMsg, {
                closeButton: true,
                autoClose: 2000,
                style: { textAlign: 'center' }
            });
        }
    };

    return (
        <div className="batch-popup-overlay">
            <div className="migrate-owner-content">
                <div className="batch-file-header">
                    <h2 className="batch-file-title">Reassign Work Order</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                {/* Block 1: Work Order Title */}
                <div className="migrate-owner-group">
                    <div className="batch-file-text">Work Order Title</div>
                    <div className="migrate-owner-readonly-box">
                        {task?.taskTitle || "-"}
                    </div>
                </div>

                {/* Block 2: Work Order Current Responsible */}
                <div className="migrate-owner-group">
                    <div className="batch-file-text">Work Order Current Responsible</div>
                    <div className="migrate-owner-readonly-box">
                        {currentResponsible || "-"}
                    </div>
                </div>

                {/* Block 3: Select New Responsible User */}
                <div className="migrate-owner-group">
                    <div className="batch-file-text">Select New Responsible User</div>
                    <div className="migrate-owner-page-select-container">
                        <select
                            value={selectedNewResponsible}
                            className="migrate-owner-page-select"
                            onChange={(e) => setSelectedNewResponsible(e.target.value)}
                            disabled={usersLoading}
                        >
                            <option value="">
                                {usersLoading ? "Loading users..." : "Select New Responsible User"}
                            </option>
                            {usersList
                                .filter(user => user.username !== currentResponsible)
                                .sort((a, b) => (a.username || "").localeCompare(b.username || ""))
                                .map((user, idx) => (
                                    <option key={idx} value={user.username}>
                                        {user.username}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="migrate-owner-buttons">
                    <button
                        className="migrate-owner-button-sub"
                        onClick={handleClick}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit'}
                    </button>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default MigrateWorkOrder;