import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faTrash,
    faX,
    faSearch,
    faHistory,
    faPlus,
    faPenToSquare,
    faPlusCircle,
    faEdit,
    faCirclePlus
} from '@fortawesome/free-solid-svg-icons';
import "./ApproversPopup.css";
import { toast } from "react-toastify";

const ApproversPopup = ({ setApproversPublish, closeModal, handleSubmit }) => {
    const [users, setUsers] = useState([]);
    const [approvers, setApprovers] = useState([{ userId: "" }]);
    const [error, setError] = useState("");

    // 🔔 toast state
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {}
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            const sortedUsers = data.users.sort((a, b) =>
                a.username.localeCompare(b.username)
            );

            setUsers(sortedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // auto-hide toast after 3s
    useEffect(() => {
        if (!showToast) return;
        const timer = setTimeout(() => {
            setShowToast(false);
            setToastMessage("");
        }, 3000);
        return () => clearTimeout(timer);
    }, [showToast]);

    const addApproverAt = (index) => {
        setApprovers(prev => {
            const updated = [...prev];
            updated.splice(index + 1, 0, { userId: "" });
            return updated;
        });
    };

    const removeApprover = (index) => {
        setApprovers(prev => {
            if (prev.length === 1) {
                toast.dismiss();
                toast.clearWaitingQueue();
                toast.error("Must have at least 1 approver.", { autoClose: 2000, closeButton: true });
                return prev;
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleApproverChange = (index, value) => {
        setError("");
        setApprovers(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], userId: value };
            return updated;
        });
    };

    const onSubmit = () => {
        const hasEmpty = approvers.some(a => !a.userId || a.userId === "");
        if (hasEmpty) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Each row must have an user value assigned.", { autoClose: 2000, closeButton: true });
            return;
        }

        handleSubmit(approvers);
        closeModal();
    };

    const selectedUserIds = approvers.map(a => a.userId).filter(Boolean);

    return (
        <div className="popup-overlay-approvers-tms">
            <div className="popup-content-approvers-tms">
                <div className="review-date-header">
                    <h2 className="review-date-title">Select Approvers</h2>
                    <button
                        className="review-date-close"
                        onClick={closeModal}
                        title="Close Popup"
                    >
                        ×
                    </button>
                </div>

                <div className="approvers-tms-table-group">
                    <div className="popup-table-wrapper-approvers-tms">
                        <table className="popup-table font-fam">
                            <thead className="ppe-headers">
                                <tr>
                                    <th style={{ width: "80%", textAlign: "center" }}>User</th>
                                    <th style={{ width: "20%", textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvers.map((approver, index) => {
                                    const availableUsers = users.filter(u =>
                                        !selectedUserIds.includes(u._id) || u._id === approver.userId
                                    );

                                    return (
                                        <tr key={index}>
                                            <td>
                                                <div className="jra-info-popup-page-select-container">
                                                    <select
                                                        className="table-control font-fam remove-default-styling"
                                                        value={approver.userId}
                                                        onChange={(e) =>
                                                            handleApproverChange(index, e.target.value)
                                                        }
                                                    >
                                                        <option value="">Choose Approver</option>
                                                        {availableUsers.map(user => (
                                                            <option key={user._id} value={user._id}>
                                                                {user.username}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="procCent">
                                                <div className="term-action-buttons">
                                                    <button
                                                        className="remove-row-button"
                                                        style={{ paddingRight: "6px" }}
                                                        onClick={() => removeApprover(index)}
                                                        title="Remove Approver"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                    <button
                                                        className="edit-terms-row-button"
                                                        style={{ paddingLeft: "6px" }}
                                                        onClick={() => addApproverAt(index)}
                                                        title="Add Approver After This"
                                                    >
                                                        <FontAwesomeIcon icon={faCirclePlus} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="abbr-buttons">
                    <button
                        onClick={onSubmit}
                        className="abbr-button-1"
                        style={{ marginLeft: "auto", marginRight: "auto" }}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApproversPopup;
