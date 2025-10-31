import React, { useState, useEffect } from "react";
import "./EquipmentPopup.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';


const EquipmentPopup = ({ isOpen, onClose, userID, setEqpData, onAdd }) => {
    const [eqp, setEqp] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [approver, setApprover] = useState("");
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_URL}/api/user/getSystemAdmins/DDS`,
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

        if (!eqp.trim()) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const route = `/api/docCreateVals/draft`;

            const data = { eqp: eqp };
            const type = "Equipment";
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
            setMessage({ text: "Equipment added as a suggestion.", type: "success" });

            const newEqp = {
                eqp: eqp.trim() + " *"
            };
            setEqpData((prevData) => [...prevData, newEqp]);

            // 2) let the parent know so it can auto-select
            if (onAdd) onAdd(newEqp);

            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (error) {
            setLoading(false);
            console.error("Error adding equipment:", error);
            setMessage({ text: "Failed to add equipment", type: "error" });
        }
    };

    const handleClose = () => {
        setLoading(false);
        setApprover("");
        setEqp("");
        setMessage({ text: "", type: "" });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="eqp-popup-overlay">
            <div className="eqp-popup-content">
                <div className="eqp-popup-header">
                    <h2 className="eqp-popup-title">Suggest New Equipment</h2>
                    <button className="eqp-popup-close" onClick={handleClose} title="Close Popup">×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="eqp-popup-group">
                        <label className="eqp-popup-label">Equipment:</label>
                        <textarea
                            rows="1"
                            spellcheck="true"
                            type="text"
                            value={eqp}
                            onChange={(e) => setEqp(e.target.value)}
                            className="abbr-popup-text-area"
                            required
                            placeholder="Insert equipment name"
                            style={{ resize: "vertical" }}
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
                        <div className={`eqp-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="eqp-popup-buttons">
                        <button type="submit" className="eqp-popup-button">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentPopup;