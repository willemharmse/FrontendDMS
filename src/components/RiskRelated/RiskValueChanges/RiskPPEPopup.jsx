import React, { useState, useEffect } from "react";
import "./RiskPPEPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const RiskPPEPopup = ({ isOpen, onClose, role, userID, setPPEData, onAdd }) => {
    const [ppe, setPPE] = useState("");
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

        if (!ppe.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = `/api/riskInfo/draft`;

            const data = { ppe: ppe };
            const type = "PPE";
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
            setMessage({ text: "PPE added as a suggestion.", type: "success" });

            const newPPE = {
                ppe: ppe.trim() + " *"
            };
            setPPEData((prevData) => [...prevData, newPPE]);

            // 2) let the parent know so it can auto-select
            if (onAdd) onAdd(newPPE);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding ppe:", error);
            setMessage({ text: "Failed to add ppe", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setPPE("");
        setApprover("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="ppe-popup-overlay">
            <div className="ppe-popup-content">
                <div className="ppe-popup-header">
                    <h2 className="ppe-popup-title">Suggest New PPE</h2>
                    <button className="ppe-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="ppe-popup-group">
                        <label className="ppe-popup-label">PPE:</label>
                        <input
                            spellcheck="true"
                            type="text"
                            value={ppe}
                            onChange={(e) => setPPE(e.target.value)}
                            className="ppe-popup-input"
                            required
                            placeholder="Insert PPE"
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
                        <div className={`ppe-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="ppe-popup-buttons">
                        <button type="submit" className="ppe-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RiskPPEPopup;