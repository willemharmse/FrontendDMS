import React, { useState, useEffect } from "react";
import "./RiskHandToolPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const RiskHandToolPopup = ({ isOpen, onClose, role, userID, setToolsData, onAdd }) => {
    const [tool, setTool] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [approver, setApprover] = useState("");
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
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

        if (!tool.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = `/api/riskInfo/draft`;

            const data = { tool: tool };
            const type = "Tool";
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    type, data, userID, approver
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                setLoading(false);
                setMessage({ text: responseData.message, type: "error" });
                return;
            }

            setLoading(false);
            setMessage({ text: "Tool added as a suggestion.", type: "success" });

            const newTool = {
                tool: tool.trim() + " *"
            };
            setToolsData((prevData) => [...prevData, newTool]);

            // 2) let the parent know so it can auto-select
            if (onAdd) onAdd(newTool);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding tool:", error);
            setMessage({ text: "Failed to add tool", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setApprover("");
        setTool("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="tool-popup-overlay">
            <div className="tool-popup-content">
                <div className="tool-popup-header">
                    <h2 className="tool-popup-title">Suggest New Tool</h2>
                    <button className="tool-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="tool-popup-group">
                        <label className="tool-popup-label">Tool:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={tool}
                            onChange={(e) => setTool(e.target.value)}
                            className="tool-popup-input"
                            required
                            placeholder="Insert tool name"
                        />
                    </div>

                    <div className="abbr-popup-group">
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
                                {usersList.map((value, index) => (
                                    <option key={index} value={value.id || value._id || value}>
                                        {value.username || value.label || value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Success/Error Message Box */}
                    {message.text && (
                        <div className={`tool-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="tool-popup-buttons">
                        <button type="submit" className="tool-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RiskHandToolPopup;