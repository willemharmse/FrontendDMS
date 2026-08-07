import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';

const WorkOrderSuggestion = ({ isOpen, onClose, userID }) => {
    const [type, setType] = useState("");
    const [desciption, setDesciption] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [approver, setApprover] = useState("");
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_URL}/api/user/getSystemAdmins/FTS`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setUsersList(data.users);
            } catch (error) {
                console.log(error);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        if (!type.trim() || !desciption.trim()) {
            alert("Please fill in both fields");
            return;
        }

        try {
            const route = `/api/docCreateVals/draftFTS`;

            const data = { type, desciption };
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    type: "WorkOrder", data, userID, approver
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                setLoading(false);
                setMessage({ text: responseData.message, type: "error" });
                return;
            }

            setLoading(false);
            setMessage({ text: "Work Order Type added successfully!", type: "success" });;

            setTimeout(() => {
                handleClose();
            }, 3000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding term:", error);
            setMessage({ text: "Failed to add term", type: "error" });
        }
    };

    const handleClose = () => {
        setType("");
        setLoading(false);
        setMessage({ text: "", type: "" });
        setDesciption("");
        onClose();
    };

    const approverOptions = usersList.filter(u => {
        const id = String(u?.id ?? u?._id ?? u ?? "");
        return id && id !== String(userID);
    });

    if (!isOpen) return null;

    return (
        <div className="term-popup-overlay">
            <div className="term-popup-content">
                <div className="term-popup-header">
                    <h2 className="term-popup-title">Suggest New Work Order Type</h2>
                    <button className="term-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="term-popup-scrollable">
                        {/* Success/Error Message Box */}
                        {message.text && (
                            <div className={`term-message ${message.type}`} style={{ marginTop: "0px", marginBottom: "10px" }}>
                                {message.text}
                            </div>
                        )}

                        <div className="term-popup-group">
                            <label className="term-popup-label">Work Order Type</label>
                            <textarea
                                spellcheck="true"
                                type="text"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="term-popup-text-area"
                                style={{ resize: "none", minHeight: "18px" }}
                                required
                                placeholder="Insert work order type here"
                            />
                        </div>
                        <div className="term-popup-group">
                            <label className="term-popup-label">Description</label>
                            <textarea
                                rows="4"
                                spellcheck="true"
                                type="text"
                                value={desciption}
                                onChange={(e) => setDesciption(e.target.value)}
                                className="term-popup-text-area"
                                required
                                placeholder="Insert description here"
                                style={{ resize: "vertical" }}
                            />
                        </div>

                        <div className="term-popup-group">
                            <label className="abbr-popup-label">Approver:</label>
                            <div className="abbr-popup-page-select-container">
                                <select
                                    spellcheck="true"
                                    type="text"
                                    value={approver}
                                    onChange={(e) => setApprover(e.target.value)}
                                    className="abbr-popup-select"
                                    required
                                    placeholder="Select Approver"
                                >
                                    <option value="">Select Approver</option>
                                    {approverOptions.map((value, index) => (
                                        <option key={index} value={value.id || value._id || value}>
                                            {value.username || value.label || value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="term-popup-buttons">
                        <button type="submit" className="term-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkOrderSuggestion;